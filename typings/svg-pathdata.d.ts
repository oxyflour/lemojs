declare module 'svg-pathdata' {
    class SVGPathData {
        constructor(data: string)
        commands: SVGPathData.Command[]
        encode(): string
        toAbs(): SVGPathData
        toRel(): SVGPathData
        round(...args): SVGPathData
        translate(...args): SVGPathData
        scale(...args): SVGPathData
        rotate(...args): SVGPathData
        matrix(...args): SVGPathData
        skewX(...args): SVGPathData
        skewY(...args): SVGPathData
        xSymetry(...args): SVGPathData
        ySymetry(...args): SVGPathData
        aToc(...args): SVGPathData
    }

    module SVGPathData {
        export const CLOSE_PATH
        export const MOVE_TO
        export const HORIZ_LINE_TO
        export const VERT_LINE_TO
        export const LINE_TO
        export const CURVE_TO
        export const SMOOTH_CURVE_TO
        export const QUAD_TO
        export const SMOOTH_QUAD_TO
        export const ARC
        export const DRAWING_COMMANDS

        export function encode(cmds: Command[]): string
        export function parse(str: string): Command[]

        export interface Command {
            type: string
        }

        interface CommandCommon {
            x: number
            y: number
            relative: boolean
        }

        export interface CommandMoveTo extends CommandCommon {
        }

        export interface CommandLineTo extends CommandCommon {
        }

        export interface CommandCurveTo extends CommandCommon {
            x1: number
            y1: number
            x2: number
            y2: number
        }

        export interface CommandClosePath { }

        // tobe added
    }

    export = SVGPathData
}
