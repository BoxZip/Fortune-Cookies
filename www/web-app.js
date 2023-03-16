
let ACCOUNT;
let FortuneCookieRead;
let FortuneCookieWrite;
let ethersProvider;
let ethersSigner;
let MINT_TOGGLE;
let BGSTYLE;
let cookie_array_HTML;
let CONTRACT = {};
let $;

import { Network, Alchemy, AlchemySubscription } from 'alchemy-sdk';
import {ethers} from 'ethers';
import {Howl, Howler} from 'howler';
import { chainId, AlchemySettings, FortuneCookie_address, FortuneCookie_ABI } from './env.js';
/*/
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
audioContext.pause();
/*/
let crunch;
window.crunch = crunch;

window.ethers = ethers;
window.Alchemy = Alchemy;

const blockchains = {};

chainId = chainId === undefined ? 80001/*/Polygon Mumbai/*/ : chainId;

function generateButton(textContent, onClick){
    let button = document.createElement('button');
    button.textContent = textContent;
    if(typeof onClick == 'function') button.addEventListener('click', onClick);
    return button;
}

function toggleMintPage(){
    document.body.classList.toggle('showMint');
    MINT_TOGGLE = !MINT_TOGGLE;
    document.getElementById('main_page').classList.toggle('hide');
    document.getElementById('connect').textContent = MINT_TOGGLE ? "◀ Back" : "Mint Now!";
}


function playCrunchNoise(){
    //audioContext.resume();
    if(!crunch){
        window.crunch = crunch = new Howl( { src: ['/assets/crunch.wav', '/assets/crunch.ogg'], autoplay: false, volume: 1, onplayerror : function(id, error) { console.log(error); } });
    }
    crunch.play();
}

async function init(){
    setVH();
    blockchains[137] = {
        chainName: 'Polygon Mainnet',
        chainId: 137,
        network: Network.MATIC_MAINNET,
        nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
        rpcUrls: ['https://polygon-rpc.com/']
    };
    blockchains[80001] = {
        chainName: 'Polygon Mumbai',
        chainId: 80001,
        network: Network.MATIC_MUMBAI,
        nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/']
    };

    let config = {};
    config.apiKey = AlchemySettings.apiKey;
    config.network = blockchains[chainId].network;

    $ = new Alchemy(config);

    let connectWallet = generateButton('Mint Now!', async function(e){
        toggleMintPage();
        await ethEnabled();
    });
    connectWallet.className = connectWallet.id = 'connect';
    document.body.appendChild(connectWallet);

    document.getElementById('standard_mint').addEventListener('click', mintStandard);
    document.getElementById('custom_mint').addEventListener('click', mintCustom);
    

    let cookie_array = document.getElementById('cookie_array');

    var openCookie = function(e){ if(e.target.tagName.toUpperCase() == 'IMG'){ if(e.target.src.split('/').slice(-1)[0] == 'cookie.svg') playCrunchNoise(); e.target.src = '/assets/cookie-opened.svg'; } };

    if(window.outerWidth > 749) {
        cookie_array_HTML = buildCookieArray('<img src="/assets/cookie.svg" width="256px" height="256px" />', 32, 32, 2000, 2000, -1);
        cookie_array.innerHTML = cookie_array_HTML;
    }
    [].slice.call(cookie_array.childNodes).forEach((node)=>node.addEventListener('click', openCookie));

    BGSTYLE = document.body.appendChild(document.createElement('style'))

    $.ethersProvider = await $.config.getProvider();

    FortuneCookieRead = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, $.ethersProvider);

    animateBG();

    await updatePageValues();
    stayUpdated();
    //toggleMintPage();
}

function weiToEther(wei){
    return parseInt(wei) / Math.pow(10, 18);
}

async function stayUpdated(){
    await updateDynamicValues();
    requestAnimationFrame(function(){
        setTimeout(stayUpdated, 2345);
    });
}

async function updateDynamicValues(){
    let mintPaused = await FortuneCookieRead.pausedMint();
    CONTRACT.mintPaused = mintPaused;
    [].slice.call(document.querySelectorAll('.mintstatus')).forEach(async function(el){
        el.innerText = mintPaused? 'paused' : 'live';
    });
    let tokenCount = await FortuneCookieRead.tokenCount();
    CONTRACT.tokenCount = tokenCount;
    [].slice.call(document.querySelectorAll('.tokencount')).forEach(async function(el){
        el.innerText = tokenCount;
    });
    let totalOpened = await FortuneCookieRead.totalOpened();
    CONTRACT.totalOpened = totalOpened;
    [].slice.call(document.querySelectorAll('.openedcount')).forEach(async function(el){
        el.innerText = totalOpened;
    });
}

async function updatePageValues(){
    let maxquantity = await FortuneCookieRead.maxMintQuantity();
    CONTRACT.maxQuantity = maxquantity;
    document.getElementById('standard_quantity').max = maxquantity;
    document.getElementById('custom_quantity').max = maxquantity;
    [].slice.call(document.querySelectorAll('.maxquantity')).forEach(async function(el){
        el.innerText = maxquantity;
    });
    let maxMessageLength = await FortuneCookieRead.maxMessageLength();
    CONTRACT.maxMessageLength = maxMessageLength;
    document.getElementById('customMSG').maxlength = maxMessageLength;
    [].slice.call(document.querySelectorAll('.maxmessagelength')).forEach(async function(el){
        el.innerText = maxMessageLength;
    });
    let totalSupply = await FortuneCookieRead._totalSupply();
    CONTRACT.totalSupply = totalSupply;
    [].slice.call(document.querySelectorAll('.totalsupply')).forEach(async function(el){
        el.innerText = totalSupply;
    });

    let priceCustom = await FortuneCookieRead.priceCustom();
    CONTRACT.priceCustom = priceCustom;
    [].slice.call(document.querySelectorAll('.customprice')).forEach(async function(el){
        el.innerText = weiToEther(priceCustom) + ' MATIC';
    });
    let priceStandard = await FortuneCookieRead.priceStandard();
    CONTRACT.priceStandard = priceStandard;
    [].slice.call(document.querySelectorAll('.standardprice')).forEach(async function(el){
        el.innerText = weiToEther(priceStandard) + ' MATIC';
    });

    updateDynamicValues();
}

async function getGasPrice() {
    let feeData = (await ethersProvider.getGasPrice()).toNumber();
    let feeMultiplier = 1.5;
    return feeData * feeMultiplier;
}

async function getNonce(address) {
    let nonce = await ethersProvider.getTransactionCount(address)
    return nonce
}

async function mintStandard(){
    if(CONTRACT.mintPaused) return alert('Minting is currently paused.');
    if(!await ethEnabled() && ACCOUNT) return alert('You must be connected with MetaMask to proceed.')
    if((await ethersProvider.getNetwork()).chainId !== chainId) return alert("Please switch to your MetaMask to use the Polygon Network and try again.")

    let quantity = parseInt(document.getElementById('standard_quantity').value);
    if(quantity<1) return alert('Quantity must be atleast 1');
    if(quantity>CONTRACT.maxQuantity) return alert('Quantity must be '+CONTRACT.maxQuantity+' or less');

    try{
        let gasFee = await getGasPrice();
        let nonce = await getNonce(ACCOUNT);
        let config = {
            value: (CONTRACT.priceStandard * quantity)+"",
            gasPrice: gasFee, 
            nonce: nonce
        }
        let receipt = await FortuneCookieWrite.mint(quantity, config);
        console.log(receipt);
        alert('Transaction successful!');
    }catch(err){
        alert('There was an error while your transaction was being processed:\n\n'+err.data.message);
        console.log(err);
    }
}

async function mintCustom(){
    if(CONTRACT.mintPaused) return alert('Minting is currently paused.');
    if(!await ethEnabled() && ACCOUNT) return alert('You must be connected with MetaMask to proceed.')
    if((await ethersProvider.getNetwork()).chainId !== chainId) return alert("Please switch to your MetaMask to use the Polygon Network and try again.")

    let quantity = parseInt(document.getElementById('custom_quantity').value);
    if(quantity<1) return alert('Quantity must be atleast 1');
    if(quantity>CONTRACT.maxQuantity) return alert('Quantity must be '+CONTRACT.maxQuantity+' or less');

    let message = document.getElementById('customMSG').value;
    if(message.length > CONTRACT.maxMessageLength) return alert('Message length must not exceed '+CONTRACT.maxMessageLength+' characters')
    if(message.split(/[ ]+/).join('').length == 0) return alert('The message is blank')
    
    try{
        let gasFee = await getGasPrice();
        let nonce = await getNonce(ACCOUNT);
        let config = {
            value: (CONTRACT.priceStandard * quantity)+"",
            gasPrice: gasFee, 
            nonce: nonce
        }
        let receipt = await FortuneCookieWrite.mintCustom(quantity, message, config);
        console.log(receipt);
        alert('Transaction pending.\nPlease wait for your transaction to be verified on the blockchain...');
    }catch(err){
        alert('There was an error while your transaction was being processed:\n\n'+err.data.message);
        console.log(err);
    }
}



function buildCookieArray(img, x, y, xOffset, yOffset, zOffset, spread){
    var html = "";
    spread = typeof spread == 'number' ? spread: 1;
    xOffset = typeof xOffset == 'number' ? xOffset: 1;
    yOffset = typeof yOffset == 'number' ? yOffset: 1;
    zOffset = typeof zOffset == 'number' ? zOffset: 1;

    let xAll = -512;
    let yAll = -256-128;
    let c = 0;
    for(var i=1; i<=x; i++){
        for(var j=1; j<=y; j++){
            html += '<img src="/assets/cookie.svg" style="translate: '+((xOffset*Math.pow(j, 0.79)*(2/i))+xAll)+'px '+((yOffset*Math.pow(i, 0.5)*(1/i))+yAll)+'px; scale: '+(2/i)+' '+(2/i)+' 1; z-index: '+(zOffset*i*j)+';"/>';
            c++;
        }
        html += '</div>';
    }
    return html;
}
let BG = 120;
let BGDIR = Math.random() <= 0.5 ? 1 : -1;

let SATMIN = 25;
let SATMAX = 100;
let SATDIR = Math.random() <= 0.5 ? 1 : -1;

let SAT = SATMIN+Math.floor(Math.random()*SATMAX-SATMIN);

let LUMMIN = 40;
let LUMMAX = 60;
let LUMDIR = Math.random() <= 0.5 ? 1 : -1;

let LUM = LUMMIN+Math.floor(Math.random()*LUMMAX-LUMMIN);
function animateBG(){
    let R = (Math.random()*20)-9.7;
    BG+=-7*R;
    SAT+=SATDIR * 2*R;
    LUM+=LUMDIR * 0.25*R;
    if(SAT <= SATMIN || SAT >= SATMAX){ SATDIR = -SATDIR; SAT = Math.min(Math.max(SATMIN, SAT), SATMAX); }
    if(LUM <= LUMMIN || LUM >= LUMMAX){ LUMDIR = -LUMDIR; LUM = Math.min(Math.max(LUMMIN, LUM), LUMMAX); }
    (Math.random() <= 0.05) ? BGDIR = -BGDIR : null;
    if(!BGSTYLE) BGSTYLE = document.body.appendChild(document.createElement('style'));
    BGSTYLE.id = 'BGSTYLE';
    let values = Math.abs(BG%360)+", "+100+"%, "+50+"%";
    BGSTYLE.innerText = ".BG, body, #mint button, .showMint #connect { transition: background-color 2.97s; background-color: hsla("+values+",0.5); }  h1 { transition: color 2.97s; color: hsl("+values+"); } #contract b, #main_page b, #main_page u, #main_page i{ transition: background-color 2.97s color 2.97s; background-color: hsla("+values+", 0.15); color: hsla("+values+", 1); }";
    requestAnimationFrame(function(){ setTimeout(animateBG, 3000) });
}

let listeners = [];
function onConnect(){
    if(listeners.indexOf(ACCOUNT.toLowerCase()) == -1){
        $.ws.on({
            method: 'alchemy_minedTransactions',
            addresses: [{"to": FortuneCookie_address, "from": ACCOUNT}]
        }, handleTransactionResponse );
        
        listeners.push(ACCOUNT.toLowerCase());
    } 
}

function handleTransactionResponse(txn){
    if(txn.removed){
        alert('Transaction reverted. \nCheck etherscan for more information.');
    }else{
        alert('Transaction confirmed!')
    }
}

const ethEnabled = async () => {
    if (window.ethereum) {
        await chainSwitchInstall(chainId);

        let accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        ACCOUNT = accounts[0]
        
        window.ethereum.on('accountsChanged', function (accounts) {
            ACCOUNT = accounts[0];
            onConnect();
        });

        if(ACCOUNT) onConnect();

        ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        ethersSigner = ethersProvider.getSigner();

        if((await ethersProvider.getNetwork()).chainId == chainId) FortuneCookieWrite = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, ethersSigner);

        return true;  
    }  
    return false;
}

async function chainSwitchInstall(chainId){
    if (window.ethereum.networkVersion !== chainId) {
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x'+(chainId).toString(16) }]
            });
        } catch (err) {
            // This error code indicates that the chain has not been added to MetaMask
            if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                {
                    chainName: blockchains[chainId].chainName,
                    chainId: '0x'+(chainId).toString(16),
                    nativeCurrency: blockchains[chainId].nativeCurrency,
                    rpcUrls: blockchains[chainId].rpcUrls
                }
                ]
            });
            }
        }
    }
}

window.addEventListener('load', init);
let setVH = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};
setVH();
window.addEventListener('resize', setVH);