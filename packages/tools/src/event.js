import XEUtils from 'xe-utils'
import { browse } from '../../tools/src/dom'

// 监听全局事件
const wheelName = browse.firefox ? 'DOMMouseScroll' : 'mousewheel'
const eventStore = []

export const GlobalEvent = {
  on (comp, type, cb) {
    if (cb) {
      eventStore.push({ comp, type, cb })
    }
  },
  off (comp, type) {
    XEUtils.remove(eventStore, item => item.comp === comp && item.type === type)
  },
  trigger (evnt) {
    const isWheel = evnt.type === wheelName
    eventStore.forEach(({ comp, type, cb }) => {
      // 如果被取消冒泡，不再执行
      if (!evnt.cancelBubble) {
        if (type === evnt.type || (isWheel && type === 'mousewheel')) {
          cb.call(comp, evnt)
        }
      }
    })
  },
  eqKeypad (evnt, keyVal) {
    const { key } = evnt
    if (keyVal.toLowerCase() === key.toLowerCase()) {
      return true
    }
    return false
  }
}

if (browse.isDoc) {
  if (!browse.msie) {
    document.addEventListener('copy', GlobalEvent.trigger, false)
    document.addEventListener('cut', GlobalEvent.trigger, false)
    document.addEventListener('paste', GlobalEvent.trigger, false)
  }
  document.addEventListener('keydown', GlobalEvent.trigger, false)
  document.addEventListener('contextmenu', GlobalEvent.trigger, false)
  window.addEventListener('mousedown', GlobalEvent.trigger, false)
  window.addEventListener('blur', GlobalEvent.trigger, false)
  window.addEventListener('resize', GlobalEvent.trigger, false)
  window.addEventListener(wheelName, XEUtils.throttle(GlobalEvent.trigger, 100, { leading: true, trailing: false }), false)
}

export default GlobalEvent
