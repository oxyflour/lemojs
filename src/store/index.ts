/// <reference path="../../typings/tsd.d.ts" />

import { createStore } from 'redux'
import { timeline as timelineReducer } from '../reducers'

export const timeline = createStore(timelineReducer)
