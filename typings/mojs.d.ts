declare module mojs {
    // just for convinience
    interface Tweenable {
    }

    class Timeline implements Tweenable {
        state: string
        timelines: Tweenable[]
        isCompleted: boolean

        props: {
            time: number
            repeatTime: number
            shiftedRepeatTime: number
        }

        constructor(options?: Timeline.InitOptions)

        add(...args: Tweenable[])
        pushTimelineArray(array: Tweenable[])
        setProp(prop: any)
        pushTimeline(timeline: Tweenable, shift?: number)
        remove(timeline: Tweenable)
        append(...timeline: Tweenable[])
        appendTimeline(...timeline: Tweenable[])
        recalcDuration(): number

        update(time?: number, isGrow?: boolean)

        start(time?: number)
        pause()
        stop()
        restart()

        setStartTime(time: number)
        startTimelines(time: number)
        setProgress(progress: number)
        getDimentions(time: number)
    }

    module Timeline {
        interface InitOptions {
            onStart?: Function
            onComplete?: Function
            onUpdate?: (progress: number) => void

            repeat?: number
            delay?: number
        }
    }

    class Transit implements Tweenable {
        progress: number
        el: HTMLElement

        constructor(options: Transit.InitOptions)
        then(options: Transit.InitOptions): Transit
        render()
        setProgress(progress: number, isShow?: boolean)
    }

    module Transit {
        interface InitOptions {
            ctx?: HTMLElement
            bit?: string | HTMLElement

            strokeWidth?: number
            strokeOpacity?: number
            strokeDasharray?: number
            strokeDashoffset?: number
            stroke?: string
            fill?: string
            fillOpacity?: string
            strokeLinecap?: string
            points?: number

            x?: number
            y?: number
            shiftX?: number
            shiftY?: number
            opacity?: number

            radius?: number
            radiusX?: number
            radiusY?: number
            angle?: number
            size?: any // ...
            sizeGap?: number

            onStart?: Function
            onComplete?: Function

            onUpdate?: Function

            duration?: number
            delay?: number
            repeat?: number
            yoyo?: boolean
            easing?: string

            parent?: Element

            isRunLess?: boolean
        }
    }

    class Burst extends Transit {
    }

    module Burst {
        interface InitOptions {
            // presentation props
            count?: number
            degree?: number
            opacity?: number
            randomAngle?: number
            randomRadius?: number
            // position props/el props
            x?: number
            y?: number
            shiftX?: number
            shiftY?: number
            easing?: string
            // size props
            radius?: any
            radiusX?: number
            radiusY?: number
            angle?: number
            size?: any
            sizeGap?: number
            // callbacks
            duration?: number
            delay?: number
            onStart?: Function
            onComplete?: Function
            onCompleteChain?: Function
            onUpdate?: Function
            isResetAngles?: boolean

            childOptions: InitChildOptions
        }

        interface InitChildOptions {
            // -- intersection starts
            radius?: any
            radiusX?: number
            radiusY?: number
            angle?: number
            opacity?: number
            // callbacks
            onStart?: Function
            onComplete?: Function
            onUpdate?: Function
            // -- intersection ends
            points?: number
            duration?: number
            delay?: number
            repeat?: number
            yoyo?: boolean
            easing?: string
            type?: string
            fill?: string
            fillOpacity?: number
            isSwirl?: boolean
            swirlSize?: number
            swirlFrequency?: number
            stroke?: string
            strokeWidth?: number
            strokeOpacity?: number
            strokeDasharray?: string
            strokeDashoffset?: string
            strokeLinecap?: any
        }
    }

    class MotionPath {
        constructor(opts: MotionPath.InitOptions)
        then(opts: MotionPath.InitOptions)
    }

    module MotionPath {
        interface InitOptions {
            path: string | SVGPathElement | any
            curvature: {
                x: number | string
                y: number | string
            }
            isCompositeLayer: boolean
            delay: number
            duration: number
            easing: string | Function | any[]
            repeat: number
            yoyo: boolean
            offsetX: number
            offsetY: number
            angleOffset: number | Function
            pathStart: number
            pathEnd: number
            motionBlur: number
            transformOrigin: string | Function
            isAngle: boolean
            isReverse: boolean
            isRunLess: boolean
            isPresetPosition: boolean
            onStart: Function
            onComplete: Function
            onUpdate: Function
        }
    }

    class Stagger {
        constructor(cls: Function)
    }
}
