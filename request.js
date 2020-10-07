function makeRequest(method, url, data) {
    return new Promise((resolve, reject) => {
        const http = new XMLHttpRequest()
        http.open(method, url)
        http.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                let res = http.response
                try {
                    res = JSON.parse(res)
                    resolve(res)
                } catch (error) {
                    reject({
                        status: this.status,
                        statusText: error
                    })
                }
            } else {
                reject({
                    status: this.status,
                    statusText: http.statusText
                })
            }
        }
        http.onerror = function () {
            reject({
                status: this.status,
                statusText: http.statusText
            })
        }

        if (method == 'GET') {
            http.send()
        } else {
            data = data || {}
            http.send(JSON.stringify(data))
        }
    })
}

export default {
    get(url) {
        return makeRequest('GET', url)
    },
    post(url, data) {
        return makeRequest('POST', url, data)
    },
}