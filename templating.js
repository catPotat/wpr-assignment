function forInTemplating(data = {}, n = 1) {
    // not complete
    let tmplt = document.querySelector(`[for-in-${n}]`)
    if (!tmplt) return
    let list = data[tmplt.getAttribute(`for-in-${n}`)]
    list.slice().reverse().forEach(obj => {
        doTheTemplating(tmplt, obj)
        forInTemplating(obj, n + 1)
    })
}

function doTheTemplating(tmplt, data = {}) {
    const clon = tmplt.cloneNode(true)
    for (const key in data) {
        clon.innerHTML = clon.innerHTML.replace(
            new RegExp(`\{${key}\}`, 'g'),
            _match => sanitize(data[key].toString())
        )
    }
    const fragment = document.importNode(clon.content, true)
    fragment.firstElementChild.setAttribute("data-spawned", "")
    tmplt.parentElement.insertBefore(fragment, tmplt.nextSibling)
}

function cleanUpMess() {
    document.querySelectorAll('[data-spawned]').forEach(el => {
        el.remove()
    })
}

function sanitize(raw) {
    raw = raw.replaceAll('<', '&#60')
    raw = raw.replaceAll('>', '&#62')
    raw = raw.replaceAll('/', '&#47')
    let sanitized = raw
    return sanitized
}


export default {
    doTheTemplating, forInTemplating, cleanUpMess
}
