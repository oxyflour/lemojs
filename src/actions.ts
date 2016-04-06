// TODO: split it into seperated files

import { Store } from 'redux'

import { Animation, Tween } from './timeline'

var typeIdCount = 1
function createAction<T extends Action>() {
    var type = typeIdCount ++,
        from = (data: any) => data as T,
        dispatch = (store: Store, data: T) => (data.type = type, store.dispatch(data))
    return { dispatch, type, from }
}

export interface Action {
    type?: number
}

export module Action {
    export const addTween = createAction<{
        anim: Animation
        tween: Tween
        index?: number
    }>()

    export const updateTween = createAction<{
        tween: Tween
        update: any
    }>()

    export const removeTween = createAction<{
        tween: Tween
    }>()

    export const addAnimation = createAction<{
        anim: Animation
        index?: number
    }>()

    export const updateAnimation = createAction<{
        anim: Animation
        update: any
    }>()

    export const removeAnimation = createAction<{
        anim: Animation
    }>()

    export const replaceTimeline = createAction<{
        timeline: Animation[]
    }>()
}
