let locked = true

const $data = getProps()
const $config = { ...$data }
const box = $('#box')
const bgImg = $('.img')
const preview = $('#preview')
const prevBtn = $('#switchPreview')
const fullBtn = $('#full')
const list = $('#list')
const MockBtn = $('#switchMock')
const codeBox = $('#codeBox')
const saves = $('#saves')
initSaves()

handleClick(list, ({ target }) => {
  const { id } = target;
  if (id.startsWith('_')) {
    renderConf(id.slice(1))
  }
})

handleClick($('#cls'), showModal)

function showModal(y = false) {
  $('#modal').classList.toggle('off', y)
}

handleClick(prevBtn, () => {
  $('.main').classList.toggle('prev')
  preview.classList.toggle('off')
}, 1)

handleClick($('#lock'), () => {
  locked = !locked
  box.classList.toggle('unlock')
  $('#restore').classList.toggle('disabled')
}, 1)

handleClick($('#switchMask'), () => {
  $('#container').classList.toggle('hide')
  $('#edit').classList.toggle('off')
}, 1)

handleClick($('#edit'), () => {
  list.classList.toggle('off')
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
  if (!Object.keys(diff).length) {
    alert('no change')
    return
  }
  localStorage.setItem(key, JSON.stringify(diff))
  const r = renderRecord(key)
  saves.appendChild(r)
})

handleClick($('#load'), () => {
  saves.classList.toggle('off')
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
    alert('paste failed:' + err)
  }
})

handleClick($('#copy'), async () => {
  const t = codeBox.textContent.trim()
  try {
    await navigator.clipboard.writeText(t)
    alert('copied')
  } catch (err) {
    alert('copy failed:' + err)
  }
})

function diffData() {
  const diff = {}
  for (const key in $config) {
    if ($config[key] !== '' && $config[key] !== $data[key]) {
      diff[key] = $config[key]
    }
  }
  return diff
}

function renderConf(type) {
  const inputs = renderInputs($config, type)
  showModal()
  $('#tab').innerHTML = ''
  $('#tab').appendChild(inputs)
}

function importData(data) {
  for (const key in data) {
    if (!$config.hasOwnProperty(key)) continue
    _update(key, data[key])
  }
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
  handleClick(saves, ({ target }) => {
    const { id } = target
    if (!id) return
    if (id.startsWith('del_')) {
      localStorage.removeItem(id.replace('del_', ''))
      saves.removeChild(target.parentElement)
      return
    }
    parseData(localStorage.getItem(id))
  }, 1)
}

function parseData(s) {
  try {
    const data = JSON.parse(s)
    importData(data)
    showModal(true)
  } catch (err) {
    alert(`err: ${err}`)
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
    if (locked) return
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

function _update(key, v) {
  const _v = v?.trim()
  box.style.setProperty(key, _v)
  $config[key] = _v
}

function renderRecord(key) {
  const div = document.createElement('div')
  div.className = 'record'
  const ts = new Date(+key.replace('w_', '')).toLocaleString()
  div.innerHTML = `<div id="${key}">${ts}</div><div id="del_${key}">×</div>`
  return div
}

function renderInputs(data, type) {
  const frag = document.createDocumentFragment()
  for (const key in data) {
    if (!key.startsWith(`--${type}`)) continue
    const div = document.createElement('div')
    div.className = 'items'
    const span = document.createElement('span')
    span.textContent = key.replace('--', '')
    const input = document.createElement('input')
    input.addEventListener('blur', ({ target }) => {
      _update(key, target.value)
    })
    input.value = data[key]
    input.spellcheck = false
    input.placeholder = $data[key]
    div.appendChild(span)
    const isNum = !key.includes('color') && !key.includes('ratio')
    div.appendChild(input)
    if (isNum) {
      const up = renderBtn('+')
      const down = renderBtn('-')
      function renderBtn(type) {
        const btn = document.createElement('div')
        btn.textContent = type
        btn.className = 'btn c'
        btn.onclick = () => {
          const cur = data[key]
          let { groups: { num, unit } } = /^(?<num>[+-]?\d*\.?\d+)(?<unit>[a-z%]*)$/i.exec(cur)
          num = +num + (type === '+' ? 1 : -1)
          const n = `${num}${unit}`
          input.value = n
          _update(key, n)
        }
        return btn
      }
      div.appendChild(up)
      div.appendChild(down)
    }
    frag.appendChild(div)
  }
  return frag
}
function getProps() {
  const props = {}
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = sheet.cssRules
    } catch (e) {
      continue
    }
    for (const rule of rules) {
      if (rule.selectorText === 'body') {
        for (const name of rule.style) {
          if (name.startsWith('--')) {
            props[name] = window.getComputedStyle(document.body).getPropertyValue(name)
          }
        }
      }
    }
  }
  return props
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