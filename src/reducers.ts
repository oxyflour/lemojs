/// <reference path="../typings/tsd.d.ts" />

import { Animation, Tween } from './timeline'

import { Action } from './actions'

import { clone } from './utils'

function createRedux<S>(
        defState: S,
        map: { [key: number]: (state: S, action: Action) => S },
        defRedux: (state: S, action: Action) => S = x => x) {
    return (state = defState, action: Action): S => {
        return (map[action.type] || defRedux)(state, action)
    }
}

export const timelineReducer = createRedux<Animation[]>([ ], {
    [Action.addTween.type]: (state, action) => {
        var { anim, tween, index } = Action.addTween.from(action),
            tweens = anim.tweens.slice()
        tweens.splice(+index === index ? index : tweens.length, 0, clone(tween))
        return timelineReducer(state, Action.updateAnimation.create({ anim, update: { tweens } }))
    },
    [Action.updateTween.type]: (state, action) => {
        var { tween, update } = Action.updateTween.from(action),
            anim = state.filter(a => a.tweens.indexOf(tween) >= 0)[0],
            tweens = anim && anim.tweens.map(t => t === tween ? clone(t, update) : t)
        return timelineReducer(state, Action.updateAnimation.create({ anim, update: { tweens } }))
    },
    [Action.removeTween.type]: (state, action) => {
        var { tween } = Action.removeTween.from(action),
            anim = state.filter(a => a.tweens.indexOf(tween) >= 0)[0],
            tweens = anim && anim.tweens.filter(t => t !== tween)
        return timelineReducer(state, Action.updateAnimation.create({ anim, update: { tweens } }))
    },
    [Action.addAnimation.type]: (state, action) => {
        var { anim } = Action.addAnimation.from(action)
        return state.concat(clone(anim))
    },
    [Action.updateAnimation.type]: (state, action) => {
        var { anim, update } = Action.updateAnimation.from(action)
        return state.map(a => a === anim ? clone(a, update) : a)
    },
    [Action.removeAnimation.type]: (state, action) => {
        var { anim } = Action.removeAnimation.from(action)
        return state.filter(a => a !== anim)
    },
    [Action.replaceTimeline.type]: (state, action) => {
        var { timeline } = Action.replaceTimeline.from(action)
        return timeline
    }
})
