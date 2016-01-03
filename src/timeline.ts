import { FakeHash, generateBezier } from './utils'

export const EASING_OPTIONS = ['cubic.in', 'cubic.out', 'sin.in', 'sin.out', 'elastic.in', 'elastic.out']

export const LINECAP_STYLES = ['normal', 'round']

export interface AnimNode {
    delay: number,
    duration: number,
    animType: string,
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

    getTimeline(): AnimObject[]
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
    setState(state: any)
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

        if (opt.easing && EASING_OPTIONS.indexOf(opt.easing) < 0) {
            if (opt.easing.indexOf('bezier') === 0) {
                opt.easing = generateBezier.apply(null,
                    opt.easing.split(' ').slice(1).map(parseFloat))
            }
            else {
                console.warn('unsupported easing: ' + opt.easing)
            }
        }

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
            if (anim.animType === 'motion-path') {
                // elem of motion-path are borrowed, so we just do noting
            }
            else {
                var el = tl['el'] as HTMLElement,
                    pt = el && el.parentNode
                el && pt && pt.removeChild(el)
                // remember to remove dynamically created svg
                el && el['parent-is-dynamic'] && pt && pt.parentNode.removeChild(pt)
            }
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
                        .css(SVG_STYLE).css('z-index', opt['zIndex']).prependTo(this.element)
                    opt.bit = svg.children()[0]
                    // remember to remove dynamically created svg
                    opt.bit['parent-is-dynamic'] = true
                }

                transit = new mojs.Transit(firstOpt = opt)

                // force creating element
                transit.render()
                if (transit.el) {
                    transit.el.id = 'anim_obj_' + anim.name.replace(/ /g, '_')
                    transit.el.style.zIndex = opt['zIndex'] || 0
                }
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
        var stagger = anim['stagger'],
            transits: mojs.Transit[] = [ ]
        if (stagger) {
            var delay = anim['delayDelta'],
                node0 = anim.nodes[0],
                keys = Object.keys(stagger),
                len = Math.max(...keys.map(k => stagger[k].length || 0))

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
                    // override onUpdate to sync position
                    var onUpdate = newNode0.onUpdate
                    newNode0.onUpdate = (p) => {
                        onUpdate && onUpdate(p)
                        transits[i].el.style.transform = transits[0].el.style.transform
                    }
                }

                transits.push(this.getTransit(newAnim))
            })
        }
        else {
            var transit = this.getTransit(anim)
            if (transit) transits.push(transit)
        }

        // update connected motion-paths
        this.hash.key().forEach((a: AnimObject) => {
            if (a.animType === 'motion-path') {
                if (a.nodes.some(n => n['elemName'] === anim.name || n['pathName'] === anim.name))
                    setTimeout(() => this.update(a), 0)
            }
        })

        return transits
    }

    addBurst(anim: AnimObject) {
        var delay = 0,
            bursts: mojs.Burst[] = []
        anim.nodes.forEach(node => {
            var opt = this.parseOptions(node) as mojs.Burst.InitOptions

            // Note: bursts only use x/y and setting shiftX/Y is not working at all
            var { shiftX, shiftY } = opt
            opt.x = shiftX
            opt.y = shiftY
            opt.shiftX = opt.shiftY = 0

            opt.delay = delay + opt.delay

            var burst = new mojs.Burst(opt)
            burst.render()
            bursts.push(burst)

            delay = opt.delay + opt.duration
        })

        return bursts
    }

    addMotionPath(anim: AnimObject) {
        var motionPath: mojs.MotionPath = null,
            lastOpt: mojs.MotionPath.InitOptions = { }
        anim.nodes.forEach(node => {
            var opt: mojs.MotionPath.InitOptions = this.parseOptions(node)
            Object.keys(lastOpt).forEach(k => {
                if (opt[k] === undefined)
                    opt[k] = lastOpt[k]
            })

            // try to get connected elements
            if (opt['elemName'])
                opt.el = $('#anim_obj_' + opt['elemName'].replace(/ /g, '_'))[0]
            if (opt['pathName'])
                opt.path = $('#anim_obj_' + opt['pathName'].replace(/ /g, '_')).parent().find('path')[0]

            // create dummy elements so that mojs will not complain
            if (!opt.el)
                opt.el = $('<div></div>')[0]
            if (!opt.path)
                opt.path = $('<svg><path d="M0,0 L0,0"></path></svg>').find('path')[0]

            if (!motionPath)
                motionPath = new mojs.MotionPath(opt)
            else
                motionPath = motionPath.then(opt)

            lastOpt = opt
        })

        return motionPath ? [motionPath] : []
    }

    update(anim: AnimObject) {
        this.remove(anim)
        if (anim.disabled) return

        var objs: mojs.Tweenable[]
        if (anim.animType === 'transit')
            objs = this.addTransit(anim)
        else if (anim.animType === 'burst')
            objs = this.addBurst(anim)
        else if (anim.animType === 'motion-path')
            objs = this.addMotionPath(anim)
        else
            throw 'not implemented'

        this.tween.add(objs)
        this.hash.put(anim, objs)

        this.tween.recalcDuration()
        // important to refresh animation object
        this.tween.setStartTime(this.tween.props.time)
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
