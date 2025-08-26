import { data as $data, NAME, SP, BGTRANS, SAVEPREFIX as $spf } from './js/config.js'

const pf = '--'
const $curConf = {}
const $palette = {}
initData()

const box = $('#box')
const preview = $('#preview')
const list = $('#list')
const codeBox = $('#codeBox')
const saves = $('#saves')

initSaves()

handleClick(list, ({ target: { id } }) => {
  if (id.startsWith('_')) {
    renderConf(id)
  }
})

function updateSelected(id = '') {
  const last = list.dataset.active
  if (last !== '') {
    $(`#${last}`)?.classList.remove('actived')
  }
  list.setAttribute('data-active', id)
  switchModal(id)
  if (id === '') return
  $(`#${id}`)?.classList.add('actived')
}

handleClick($('#swapBtn'), () => {
  $('#console').classList.toggle('swap')
})

function switchModal(x) {
  $('#console').classList[x ? 'add' : 'remove']('slide')
}

handleClick($('#switchPreview'), () => {
  $('.main').classList.toggle('prev')
  preview.classList.toggle('hide')
}, 1)

handleClick($('#lock'), () => {
  box.classList.toggle('unlock')
  $('#restore').classList.toggle('disabled')
}, 1)

handleClick($('#switchCont'), () => {
  $('#container').classList.toggle('hide')
}, 1)

handleClick($('#edit'), () => {
  $('.actions').classList.toggle('slide')
}, 1)

handleClick($('#switchMock'), () => {
  $('#mock').classList.toggle('hide')
}, 1)

handleClick($('#brightUp'), () => {
  box.classList.toggle('br')
}, 1)

handleClick($('#fullscreen'), () => {
  document.documentElement.requestFullscreen()
})

$('#wallpaper').addEventListener('change', ({ target }) => {
  upload(target, 'wallpaper')
})

$('#mockup').addEventListener('change', ({ target }) => {
  upload(target, 'mockup')
})

handleClick($('#full'), () => {
  $('.main').classList.toggle('mini')
}, 1)

handleClick($('#save'), () => {
  const key = `${$spf}${Date.now()}`
  const diff = diffData()
  localStorage.setItem(key, JSON.stringify(diff))
  const r = renderRecord(key)
  saves.appendChild(r)
  _notif('saved')
})

handleClick($('#load'), () => {
  $('.board').classList.toggle('slide')
}, 1)

handleClick($('#export'), () => {
  const diff = diffData()
  codeBox.textContent = JSON.stringify(diff, null, 2)
})

handleClick($('#import'), () => {
  parseData(codeBox.textContent.trim())
})

handleClick($('#clear'), () => {
  codeBox.textContent = ''
})

handleClick($('#paste'), async () => {
  codeBox.textContent = await paste()
})

handleClick($('#copy'), async () => {
  const t = codeBox.textContent.trim()
  try {
    await navigator.clipboard.writeText(t)
    _notif('copied')
  } catch (err) {
    _notif('copy failed:' + err)
  }
})

handleClick($('#footer'), () => {
  _notif(`EyeDropper support: ${'EyeDropper' in window}`)
})

function diffData() {
  const diff = {}
  for (const key in $curConf) {
    if ($curConf[key] !== '' && $curConf[key] !== $data[key]) {
      diff[key] = $curConf[key]
    }
  }
  return diff
}

function renderConf(id) {
  const changed = id !== list.dataset.active
  if (changed) {
    const form = renderHandler($curConf, id.slice(1))
    $('#tab').innerHTML = ''
    $('#tab').appendChild(form)
  }
  updateSelected(changed ? id : '')
}

function initSaves() {
  const frag = document.createDocumentFragment()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key.startsWith($spf)) continue
    const r = renderRecord(key)
    frag.appendChild(r)
  }
  saves.appendChild(frag)
  handleClick(saves, ({ target, currentTarget }) => {
    const { id } = target
    if (!id || id === currentTarget.id) return
    if (id.startsWith('del_')) {
      localStorage.removeItem(id.replace('del_', ''))
      saves.removeChild(target.parentElement)
      _notif('deleted')
      return
    }
    parseData(localStorage.getItem(id))
  }, 1)
}

function parseData(s) {
  try {
    initData(JSON.parse(s))
    updateSelected()
    _notif('loaded')
  } catch (err) {
    _notif(`err: ${err}`)
  }
}

function upload(target, type) {
  const file = target.files[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  if (type === 'wallpaper') {
    $('.img').style.backgroundImage = `url(${url})`
  } else if (type === 'mockup') {
    $('#mock').style.background = `url(${url}) center/contain no-repeat`
  }
}

addTransformSupport()

function initData(data = {}) {
  const f = data[NAME]?.includes('_pa')
  const d = f ? data : { ...$data, ...data }
  Object.keys(d).forEach(key => {
    _update(key, d[key], f)
  })
}

function _update(key, v, flag = false) {
  // console.log(key, v)
  const _v = v?.trim()
  if (flag) {
    document.documentElement.style.setProperty(`${pf}${key}`, _v)
    $palette[key] = _v
    return
  }
  $curConf[key] = _v
  document.body.style.setProperty(`${pf}${key}`, _v)
}

function renderRecord(key) {
  const ts = new Date(+key.replace($spf, '')).toLocaleString()
  const c = JSON.parse(localStorage.getItem(key))
  const div = $ce('div', {
    className: 'record',
    innerHTML: `<p id="${key}">[${c[NAME] || 'Untitled'}] ${ts}</p><p id="del_${key}" class="x c">×</p>`
  })
  return div
}

function renderHandler(data, type) {
  const frag = document.createDocumentFragment()
  for (const key in data) {
    if (!key.startsWith(`${type}`)) continue
    const value = data[key]
    const div = $ce('div', {
      className: 'items'
    })
    const span = $ce('span', {
      textContent: key.replace(`${type}-`, '')
    })
    const input = $ce('input', {
      onblur: ({ target }) => {
        _update(key, target.value)
      },
      value,
      name: key,
      spellcheck: false,
      placeholder: $data[key]
    })
    div.appendChild(span)
    const isColor = key.includes('-color')
    const isSpecial = key.includes(SP)
    const isNum = !isColor && !isSpecial
    div.appendChild(input)
    if (isColor) {
      const color = $ce('p', {
        className: 'btn',
        style: `--btn-bg: var(${pf}${key});`,
        onclick: async () => {
          // show dialog
          const t = await paste()
          if (!t) return
          input.value = t
          _update(key, t)
        }
      })
      div.appendChild(color)
    }
    if (isNum) {
      const up = renderBtn('+')
      const down = renderBtn('-')
      function renderBtn(type) {
        const btn = $ce('p', {
          textContent: type,
          className: 'btn _s c',
          onclick: () => {
            let { groups: { num, unit } } = /^(?<num>[+-]?\d*\.?\d+)(?<unit>[a-z%]*)$/i.exec(data[key])
            num = +num + (type === '+' ? 1 : -1)
            const n = `${num}${unit}`
            input.value = n
            _update(key, n)
          }
        })
        return btn
      }
      div.appendChild(up)
      div.appendChild(down)
    }
    frag.appendChild(div)
  }
  return frag
}

let timer
async function _notif(t) {
  const notif = $('#notif')
  const _t = () => new Promise((resolve) => {
    clearTimeout(timer)
    _done()
    notif.addEventListener('transitionend', resolve, { once: true })
  })
  if (timer) await _t()
  notif.textContent = t
  notif.classList.add('slide')
  timer = setTimeout(_done, 2500)
  function _done() {
    notif.classList.remove('slide')
    timer = null;
  }
}

function $(s) {
  return document.querySelector(s)
}

function handleClick(elm, handle, r) {
  if (!elm) return
  elm.addEventListener('click', (e) => {
    handle(e)
    if (r) elm.classList.toggle('actived')
  })
}

function $ce(type, props = {}) {
  const el = document.createElement(type)
  if (Object.keys(props).length) {
    for (const key in props) {
      el[key] = props[key]
    }
  }
  return el
}

async function paste() {
  try {
    const t = await navigator.clipboard.readText()
    return t?.trim()
  } catch (err) {
    _notif('paste failed:' + err)
  }
}

function addTransformSupport() {
  const bg = $('#bg')
  let scale = 1, tX = 0, ty = 0, lastPointer = { x: 0, y: 0 }
  const pointers = new Map()
  let pinchStartDist = 0, pinchStartScale = 1, pinchCenter = { x: 0, y: 0 }

  function getDist(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.hypot(dx, dy)
  }

  function getCenter(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  function updateTf() {
    _update(BGTRANS, `translate(${tX}px, ${ty}px) scale(${scale})`)
  }

  handleClick($('#restore'), () => {
    pointers.clear()
    _update(BGTRANS, '')
    scale = 1
    tX = 0
    ty = 0
  })

  bg.addEventListener('pointerdown', ({ pointerId: id, clientX, clientY }) => {
    if (!box.classList.contains('unlock')) return
    bg.setPointerCapture(id)
    pointers.set(id, { id, x: clientX, y: clientY })
    if (pointers.size === 1) {
      lastPointer = { x: clientX, y: clientY }
    } else if (pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values())
      pinchStartDist = getDist(p1, p2)
      pinchStartScale = scale
      const c = getCenter(p1, p2)
      const rect = bg.getBoundingClientRect()
      pinchCenter = { x: c.x - rect.left, y: c.y - rect.top }
    }
  })

  bg.addEventListener('pointermove', ({ pointerId: id, clientX, clientY }) => {
    if (!pointers.has(id)) return
    pointers.set(id, { id, x: clientX, y: clientY })
    if (pointers.size === 1) {
      tX += (clientX - lastPointer.x) / scale
      ty += (clientY - lastPointer.y) / scale
      updateTf()
      lastPointer = { x: clientX, y: clientY }
    } else if (pointers.size === 2) {
      if (pinchStartDist === 0) return
      const [p1, p2] = Array.from(pointers.values())
      const newDist = getDist(p1, p2)
      const newScale = pinchStartScale * newDist / pinchStartDist
      const oldScale = scale
      const sPrime = newScale
      tX = tX + pinchCenter.x * (1 / sPrime - 1 / oldScale)
      ty = ty + pinchCenter.y * (1 / sPrime - 1 / oldScale)
      scale = sPrime
      updateTf()
    }
  })

  bg.addEventListener('pointerup', ({ pointerId: id }) => {
    pointers.delete(id)
    try { bg.releasePointerCapture(id) } catch (error) { }
    if (pointers.size === 1) {
      const remaining = Array.from(pointers.values())[0];
      lastPanPointer = { x: remaining.x, y: remaining.y };
    } else {
      lastPointer = null
    }
  })
}
