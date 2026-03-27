/**
 * 入口：所有逻辑延迟到 setTimeout 后执行，避免 onLoad 阶段访问 __wxConfig.useWebWorker 报错。
 */
import {action} from 'mobx'

declare const globalThis: { __store?: { mem: { visible: boolean } } }

function init() {
  wx.onShow(action(() => {
    if (globalThis.__store) globalThis.__store.mem.visible = true
  }))

  wx.onHide(action(() => {
    if (globalThis.__store) globalThis.__store.mem.visible = false
  }))

  import('./bootstrap').then(m => m.run()).catch((err: Error) => {
    console.error(err)
    wx.showModal({
      title: '出错啦',
      confirmText: '退出',
      showCancel: false,
      success: () => wx.exitMiniProgram()
    })
  })

  wx.showShareMenu({menus: ['shareAppMessage', 'shareTimeline']})

  const updateManager = wx.getUpdateManager()
  updateManager.onUpdateReady(function () {
    wx.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success(res) {
        if (res.confirm) updateManager.applyUpdate()
      }
    })
  })
}

// 不在 onLoad 阶段调用任何 wx API；延后到下一帧并再等一帧，避免 __wxConfig.useWebWorker 取不到值
function deferInit() {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => requestAnimationFrame(init))
  } else {
    setTimeout(init, 50)
  }
}
setTimeout(deferInit, 0)
