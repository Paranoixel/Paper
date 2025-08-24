import { data as $data } from './js/config.js'

const $curConf = {}
initData($data)

const box = $('#box')
const bgImg = $('.img')
const preview = $('#preview')
const prevBtn = $('#switchPreview')
const fullBtn = $('#full')
const list = $('#list')
const MockBtn = $('#switchMock')
const codeBox = $('#codeBox')
const saves = $('#saves')
const m = $('#modal')
m._show = function () {
  this.show()
  document.activeElement.blur()
}

initSaves()

handleClick(list, ({ target: { id } }) => {
  if (id.startsWith('_')) {
    renderConf(id)
  }
})

handleClick($('#cls'), () => {
  updateSelected()
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

function switchModal(x) {
  m[x ? '_show' : 'close']()
}

handleClick(prevBtn, () => {
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
  $('.actions').classList.toggle('cover')
}, 1)

handleClick(MockBtn, () => {
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

handleClick(fullBtn, () => {
  $('.main').classList.toggle('mini')
}, 1)

handleClick($('#save'), () => {
  const key = 'w_' + Date.now()
  const diff = diffData()
  localStorage.setItem(key, JSON.stringify(diff))
  const r = renderRecord(key)
  saves.appendChild(r)
  _notif('saved')
})

handleClick($('#load'), () => {
  $('.board').classList.toggle('cover')
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
  try {
    const t = await navigator.clipboard.readText()
    codeBox.textContent = t?.trim()
  } catch (err) {
    _notif('paste failed:' + err)
  }
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
    const inputs = renderInputs($curConf, id.slice(1))
    $('#tab').innerHTML = ''
    $('#tab').appendChild(inputs)
  }
  updateSelected(changed ? id : '')
}

function initSaves() {
  const frag = document.createDocumentFragment()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key.startsWith('w_')) continue
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
    const data = JSON.parse(s)
    initData({ ...$data, ...data })
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
    bgImg.style.backgroundImage = `url(${url})`
  } else if (type === 'mockup') {
    $('#mock').style.background = `url(${url}) center/contain no-repeat`
  }
}

addTransformSupport()
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
    bgImg.style.transform = `translate(${tX}px, ${ty}px) scale(${scale})`
  }

  handleClick($('#restore'), () => {
    pointers.clear()
    bgImg.style.transform = ''
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

function initData(data) {
  Object.keys(data).forEach(key => {
    _update(key, data[key])
  })
}

function _update(key, v) {
  // console.log(key, v)
  const _v = v?.trim()
  $curConf[key] = _v
  document.body.style.setProperty(key, _v)
}

function renderRecord(key) {
  const ts = new Date(+key.replace('w_', '')).toLocaleString()
  const div = $ce('div', {
    className: 'record',
    innerHTML: `<p id="${key}">${ts}</p><p id="del_${key}" class="x">×</p>`
  })
  return div
}

function renderInputs(data, type) {
  const frag = document.createDocumentFragment()
  for (const key in data) {
    if (!key.startsWith(`--${type}`)) continue
    const value = data[key]
    const div = $ce('div', {
      className: 'items'
    })
    const span = $ce('span', {
      textContent: key.replace('--', '')
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
    const isColor = key.includes('color')
    const isNum = !isColor && !key.includes('ratio')
    div.appendChild(input)
    if (isColor) {
      const color = $ce('p', {
        className: 'btn',
        style: `--btn-bg: var(${key});`
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
  notif.classList.add('show')
  timer = setTimeout(_done, 2500)
  function _done() {
    notif.classList.remove('show')
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
