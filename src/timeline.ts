import { clone, FakeHash, generateBezier } from './utils'

export const EASING_OPTIONS = ['cubic.in', 'cubic.out', 'sin.in', 'sin.out', 'elastic.in', 'elastic.out']

export const LINECAP_STYLES = ['normal', 'round']

export interface Tween {
    delay: number,
    duration: number,
    animType: string,
}

export interface Animation {
    name: string,
    animType: string,
    tweens: Tween[],
    disabled?: boolean,
}

const SVG_STYLE = {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: '0px',
    top: '0px',
}

export class AnimManager {
    timeline: mojs.Timeline
    anims: Animation[] = [ ]
    hash = new FakeHash<Animation, mojs.Tweenable[]>()

    constructor(private element: HTMLElement, options?: mojs.Timeline.InitOptions) {
        this.timeline = new mojs.Timeline(options)
    }

    sync(timeline: Animation[]) {
        timeline.forEach(anim => anim['to-add'] = true)
        this.anims.forEach(anim => anim['has-added'] = true)

        var animsToAdd = timeline.filter(anim => anim['to-add'] && !anim['has-added']),
            animsToRemove = this.anims.filter(anim => !anim['to-add'] && anim['has-added'])

        // must add motion-path at last as it depends on other objects
        animsToAdd = animsToAdd.sort((a, b) => a.animType === 'motion-path' ? 1 : 0)
        // refresh motion-path if it depends on new added objects
        var animsToAddMap = { }
        animsToAdd.filter(anim => anim.animType !== 'motion-path')
            .forEach(anim => animsToAddMap[anim.name] = anim)
        this.anims.filter(anim => {
                return anim.animType === 'motion-path' && anim.tweens.some(tween =>
                    animsToAddMap[tween['elemName']] || animsToAddMap[tween['pathName']])
            })
            .forEach(anim => {
                if (animsToAdd.indexOf(anim) === -1)
                    animsToAdd.push(anim)
                if (animsToRemove.indexOf(anim) === -1)
                    animsToRemove.push(anim)
            })

        animsToRemove.forEach(anim => {
            var tls = this.hash.remove(anim)
            if (tls) tls.forEach(tl => {
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
                this.timeline.remove(tl['timeline'])
                this.timeline.remove(tl)
            })
            console.log('remove', anim)
        })

        animsToAdd.forEach(anim => {
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

            this.hash.put(anim, objs)
            this.timeline.add(objs)
            console.log('add', anim)
        })

        timeline.forEach(anim => delete anim['to-add'])
        this.anims.forEach(anim => delete anim['has-added'])

        this.anims = timeline.slice()

        // important to refresh animation object
        this.timeline.recalcDuration()
        this.timeline.setStartTime(this.timeline.props.time)
    }

    parseOptions(tween: Tween) {
        var opt = JSON.parse(JSON.stringify(tween)) as mojs.Transit.InitOptions

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

        opt.onUpdate = tween['onUpdate']
        opt.onStart = tween['onStart']
        opt.onComplete = tween['onComplete']

        return opt
    }

    getTransit(anim: Animation) {
        var transit: mojs.Transit = null,
            firstOpt: mojs.Transit.InitOptions = null
        anim.tweens.forEach(tween => {
            var opt = this.parseOptions(tween) as mojs.Transit.InitOptions

            if (!transit) {
                // use bitPath to create bit element
                var type = opt['bitPathType']
                if (type) {
                    var elem = '<g></g>'
                    if (type === 'path')
                        elem = '<path d="' + (opt['bitPathStr'] || '') + '"></path>'
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
                // for tweens other than first, use shiftX/shiftY instead of x/y
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

    addTransit(anim: Animation) {
        var stagger = anim['stagger'],
            transits: mojs.Transit[] = [ ]
        if (stagger) {
            var delay = anim['delayDelta'],
                tween0 = anim.tweens[0],
                keys = Object.keys(stagger),
                len = Math.max(...keys.map(k => stagger[k].length || 0))

            if (tween0) Array.apply(0, Array(len)).map((x, i) => {
                var newAnim: Animation = JSON.parse(JSON.stringify(anim)),
                    newTween0: mojs.Transit.InitOptions = newAnim.tweens[0]
                keys.forEach(k => newTween0[k] = stagger[k][i])
                if (delay)
                    newTween0.delay = tween0.delay + delay * i

                // keep positions sync with the first one
                if (i) {
                    // disable position animation
                    delete newTween0['shiftX']
                    delete newTween0['shiftY']
                    delete newTween0['angle']
                    // override onUpdate to sync position
                    var onUpdate = newTween0.onUpdate
                    newTween0.onUpdate = (p) => {
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

        return transits
    }

    addBurst(anim: Animation) {
        var delay = 0,
            bursts: mojs.Burst[] = []
        anim.tweens.forEach(tween => {
            var opt = this.parseOptions(tween) as mojs.Burst.InitOptions

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

    addMotionPath(anim: Animation) {
        var motionPath: mojs.MotionPath = null,
            lastOpt: mojs.MotionPath.InitOptions = { }
        anim.tweens.forEach(tween => {
            var opt = this.parseOptions(tween) as mojs.MotionPath.InitOptions
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

    // controls

    start() {
        this.timeline.restart()
    }

    pause() {
        this.timeline.pause()
    }

    // query

    getDuration() {
        return this.timeline.props.time
    }

    setProgress(progress: number) {
        this.timeline.setProgress(progress)
    }

    static getTweenableNumber(val: any) {
        var key: string
        if (!val)
            return 0
        else if (val.substr)
            return parseFloat(val)
        else if (key = Object.keys(val)[0])
            return parseFloat(val[key])
        else
            return parseFloat(val) || 0
    }

    static getTweenableText(val: any) {
        var key: string
        if (val === 0)
            return '0'
        else if (!val)
            return ''
        else if (val.substr)
            return val
        else if (key = Object.keys(val)[0])
            return key + ':' + val[key]
        else
            return val
    }

    static replaceTweenableValue(oldVal: any, newVal: number | string) {
        var key: string
        if (!oldVal)
            return newVal
        else if (oldVal.substr)
            return typeof newVal === 'number' ?
                oldVal.replace(/^-?[\d\.]+/, newVal) : newVal
        else if (key = Object.keys(oldVal)[0])
            return $.extend(oldVal, { [key]:
                AnimManager.replaceTweenableValue(oldVal[key], newVal) })
        else
            return newVal
    }
}
