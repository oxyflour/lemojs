// TODO: split it into seperated files

import { AnimObject, AnimNode } from './timeline'

var typeIdCount = 1
function createAction<T extends Action>() {
    var type = typeIdCount ++,
        from = (data: any) => data as T,
        create = (data: T) => (data.type = type, data)
    return { create, type, from }
}

export interface Action {
    type?: number
}

export module Action {
    export const addAnimNode = createAction<{
        anim: AnimObject
        node: AnimNode
        index?: number
    }>()

    export const updateAnimNode = createAction<{
        node: AnimNode
        update: any
    }>()

    export const removeAnimNode = createAction<{
        node: AnimNode
    }>()

    export const addAnimObject = createAction<{
        anim: AnimObject
        index?: number
    }>()

    export const updateAnimObject = createAction<{
        anim: AnimObject
        update: any
    }>()

    export const removeAnimObject = createAction<{
        anim: AnimObject
    }>()

    export const replaceTimeline = createAction<{
        timeline: AnimObject[]
    }>()
}
