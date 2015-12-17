import { FakeHash } from './utils'

export interface AnimNode {
    delay: number,
    duration: number,
    animType: string,
    x: number,
    y: number,
}

export interface AnimObject {
    name: string,
    animType: string,
    nodes: AnimNode[],
    disabled?: boolean,
}

export interface Timeline {
    activeAnimNode: AnimNode
    activeAnimObject: AnimObject
    cursorPosition: number

    toggleAnimObjectEnableDisable(anim: AnimObject)
    shiftAnimObjectToCursor(delta: number)

    getAnimObjectFromNode(node: AnimNode): AnimObject
    getAnimNodeStart(node: AnimNode): number

    removeActiveAnimNode()
    cloneActiveAnimNode()
    addAnimNode()

    removeActiveAnimObject(anim?: AnimObject)
    cloneActiveAnimObject()
    addAnimObject(type: string)
    refreshAnimObject(node: AnimNode | AnimObject)

    forceUpdate()
}

const SVG_STYLE = {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: '0px',
    top: '0px',
}

function array(size: number) {
    return Array.apply(null, new Array(size))
}

export class AnimManager {
    tween: mojs.Timeline
    hash: FakeHash

    constructor(private element: HTMLElement, options?: mojs.Timeline.InitOptions) {
        this.tween = new mojs.Timeline(options)
        this.hash = new FakeHash()
    }

    parseOptions(node: AnimNode) {
        var opt = JSON.parse(JSON.stringify(node)) as mojs.Transit.InitOptions

        // don't start when added
        opt.isRunLess = true

        opt.parent = this.element

        opt.onUpdate = node['onUpdate']
        opt.onStart = node['onStart']
        opt.onComplete = node['onComplete']

        return opt as any
    }

    // manage animations

    remove(anim: AnimObject) {
        var oldNodes = this.hash.get(anim) as mojs.Timeline[]
        if (oldNodes) oldNodes.forEach(tl => {
            // cleanup
            var el = tl['el'] as HTMLElement,
                pt = el && el.parentNode
            el && pt && pt.removeChild(el)
            el && el['remove-parent'] && pt && pt.parentNode.removeChild(pt)
            // weird?
            this.tween.remove(tl['timeline'])
            this.tween.remove(tl)
        })
    }

    getTransit(anim: AnimObject) {
        var transit: mojs.Transit = null,
            firstOpt: mojs.Transit.InitOptions = null
        anim.nodes.forEach(node => {
            var opt = this.parseOptions(node) as mojs.Transit.InitOptions

            if (!transit) {
                // use bitPath to create bit element
                var type = opt['bitPathType']
                if (type) {
                    var elem = '<g></g>'
                    if (type === 'path')
                        elem = '<path d="' + opt['bitPathStr'] + '"></path>'
                    else if (type === 'ellipse')
                        elem = '<ellipse></ellipse>'
                    // NOTE: you can only use svg as root element in jquery
                    var svg = $('<svg>' + elem + '</svg>')
                        .css(SVG_STYLE).css('z-index', opt['zIndex'] || 0).prependTo(this.element)
                    opt.bit = svg.children()[0]
                    // remember to remove dynamically created svg
                    opt.bit['remove-parent'] = true
                }

                transit = new mojs.Transit(firstOpt = opt)
            }
            else {
                // for nodes other than first, use shiftX/shiftY instead of x/y
                if (opt.shiftX === undefined && opt.x !== undefined)
                    opt.shiftX = opt.x - firstOpt.x
                if (opt.shiftY === undefined && opt.y !== undefined)
                    opt.shiftY = opt.y - firstOpt.y
                delete opt.x
                delete opt.y
                transit = transit.then(opt)
            }
        })

        return transit
    }

    addTransit(anim: AnimObject) {
        var stagger = anim['stagger']
        if (stagger) {
            var delay = anim['delayDelta'],
                node0 = anim.nodes[0],
                keys = Object.keys(stagger),
                len = Math.max(...keys.map(k => stagger[k].length || 0))

            var transits: mojs.Transit[] = [ ]
            if (node0) array(len).map((x, i) => {
                var newAnim: AnimObject = JSON.parse(JSON.stringify(anim)),
                    newNode0: mojs.Transit.InitOptions = newAnim.nodes[0]
                keys.forEach(k => newNode0[k] = stagger[k][i])
                if (delay)
                    newNode0.delay = node0.delay + delay * i

                // keep positions sync with the first one
                if (i) {
                    // disable position animation
                    delete newNode0['shiftX']
                    delete newNode0['shiftY']
                    delete newNode0['angle']
                    newNode0.onUpdate = () => {
                        transits[i].el.style.transform = transits[0].el.style.transform
                    }
                }

                transits.push(this.getTransit(newAnim))
            })

            this.hash.put(anim, transits)
            this.tween.add(transits)
        }
        else {
            var transit = this.getTransit(anim)
            if (!transit) return

            this.hash.put(anim, [transit])
            this.tween.add(transit)
        }
    }

    addBurst(anim: AnimObject) {
        var delay = 0,
            bursts = []
        anim.nodes.forEach(node => {
            var opt = this.parseOptions(node) as mojs.Burst.InitOptions
            opt.delay = delay + opt.delay

            bursts.push(new mojs.Burst(opt))

            delay = opt.delay + opt.duration
        })

        this.hash.put(anim, bursts)
        this.tween.add(bursts)
    }

    update(anim: AnimObject) {
        this.remove(anim)
        if (anim.disabled)
            return

        if (anim.animType === 'transit')
            this.addTransit(anim)
        else if (anim.animType === 'burst')
            this.addBurst(anim)
        else
            throw 'not implemented'

        // TODO: update and show added animation object
        this.tween.recalcDuration()
    }

    // controls

    start() {
        this.tween.restart()
    }

    pause() {
        this.tween.pause()
    }

    // query

    getDuration() {
        return this.tween.props.time
    }

    setProgress(progress: number) {
        this.tween.setProgress(progress)
    }
}
