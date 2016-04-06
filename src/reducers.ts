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
    [Action.addTween.type]: (state, action) => state.map(a => {
        var { anim, tween, index } = Action.addTween.from(action)
        if (a === anim) {
            var tweens = a.tweens.slice()
            tweens.splice(+index === index ? index : tweens.length, 0, clone(tween))
            a = clone(a, { tweens })
        }
        return a
    }),
    [Action.updateTween.type]: (state, action) => state.map(a => {
        var { tween, update } = Action.updateTween.from(action)
        if (a.tweens.indexOf(tween) >= 0) {
            var tweens = a.tweens.map(n => n === tween ? clone(n, update) : n)
            a = clone(a, { tweens })
        }
        return a
    }),
    [Action.removeTween.type]: (state, action) => state.map(a => {
        var { tween } = Action.removeTween.from(action)
        if (a.tweens.indexOf(tween) >= 0) {
            var tweens = a.tweens.filter(n => n !== tween)
            a = clone(a, { tweens })
        }
        return a
    }),
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
