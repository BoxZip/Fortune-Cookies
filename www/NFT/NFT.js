import { AlchemySettings, FortuneCookie_address, FortuneCookie_ABI, chainId } from '../env.js';
import * as Web3 from '../web3.min.js';
import { Alchemy } from 'alchemy-sdk';
import {ethers} from 'ethers';

let NFT = {};
let ACCOUNT;
let FortuneCookieRead;
let FortuneCookieWrite;

window.NFT = NFT;

const $ = new Alchemy(AlchemySettings);

NFT.connected = false;

NFT.action = 'connect';

NFT.actions = {};

const blockchains = {};
blockchains[137] = {
    chainName: 'Polygon Mainnet',
    chainId: 137,
    nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
    rpcUrls: ['https://polygon-rpc.com/']
};
blockchains[80001] = {
    chainName: 'Polygon Mumbai',
    chainId: 80001,
    nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/']
};

async function init(){
    NFT.image = document.getElementById('image');
    NFT.click = document.getElementById('click');
    NFT.label = document.getElementById('label');
    NFT.note = document.getElementById('note');

    NFT.click.addEventListener('click', onClick);
    NFT.note.addEventListener('click', onNoteClick);

    $.ethersProvider = await $.config.getProvider();
    FortuneCookieRead = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, $.ethersProvider);

    let query = window.location.search;
    if(query.length > 0) query = parseInt(query.slice(1));
    else query = NaN;
    if(isNaN(query)) alert('Invalid TokenID!');
    else{
        NFT.tokenID = query;
        await load();
        update();
    }
}

async function onClick(e){
    if(!NFT.connected) await NFT.actions.connect();
    else if(NFT.connected){
        NFT.actions[NFT.action]();
    }
}
NFT.onClick = onClick;

function onNoteClick(e){
    document.body.classList.remove('reveal');
}
async function load(){
    if(typeof NFT.tokenID == 'number'){
        let _tokenID = await FortuneCookieRead.tokenCount();
        if(NFT.tokenID < 0 || NFT.tokenID >= _tokenID) alert('Invalid Token ID');
        else{
            try{
                NFT.opened = await FortuneCookieRead.isCookieOpened(NFT.tokenID);
            }catch(e){
                //
            }
            NFT.owner = await FortuneCookieRead.ownerOf(NFT.tokenID);
        }
    }
}

async function update(){
    NFT.image.src = NFT.opened ? '../cookie-opened.svg' : '../cookie.svg';
    NFT.action = NFT.opened ? 'read' : 'open';
    if(NFT.opened) document.body.classList.add('opened');
    if(typeof NFT.message == 'string'){
        let note = document.createElement('b');
        note.textContent = NFT.message;
        NFT.note.innerHTML = "";
        NFT.note.appendChild(note);
        document.body.classList.add('reveal');
    }
    if(NFT.connected){
        connectedUpdate();
    }
}

async function updateUntilOpened(){
    NFT.opened = await FortuneCookieRead.isCookieOpened(NFT.tokenID);
    if(NFT.opened){
        update();
    }else{
        requestAnimationFrame(function(){ setTimeout(updateUntilOpened, 1000) })
    }
}

function connectedUpdate(){
    NFT.label.innerText = NFT.action.toUpperCase();
    if(!NFT.owner) null;
    else if(sameAddress(NFT.owner,ACCOUNT)){
        document.body.classList.add('owner');
        NFT.authorized = true;
        if(NFT.opened && typeof NFT.message !== 'string') read();
    }
    else{
        alert("The wallet you are connected with does not hold this NFT.")
        document.body.classList.add('non-owner');
        NFT.authorized = false;
    }
}

async function connect(){
    if(!confirm("Only the owner of this NFT can interact with this NFT.\nDo you wish to continue?")) return;
    if(await ethEnabled()){
        if(ACCOUNT){
            NFT.connected = true;
            FortuneCookieWrite = new ethers.Contract(FortuneCookie_address, FortuneCookie_ABI, NFT.signer);
            document.body.classList.add('active');
            update();
        }
    }else{
        alert('You need a plugin like MetaMask to enable Web3 interaction.');
    }
    return false;
}

function sameAddress(a,b){
    return a.toLowerCase() == b.toLowerCase();
}

NFT.actions.connect = connect;

async function open(){
    if(!NFT.authorized) alert('You must be the owner of this NFT to interact with it.');

    if(!confirm("Are you sure you want to open this fortune cookie?\n(This action cannot be reversed, but you must open it to be able to read the message inside.)")) return;

    try{
        await FortuneCookieWrite.open(NFT.tokenID);
        updateUntilOpened();
    }catch(e){
        alert('Error: '+e.message);
    }
}
NFT.actions.open = open;

async function read(){
    if(!NFT.authorized) alert('You must own this NFT in order to interact with it!');
    else if(typeof NFT.message == 'string') document.body.classList.add('reveal');
    else if(NFT.opened){
        try{
            NFT.message = await FortuneCookieWrite.read(NFT.tokenID);
            update();
        }catch(e){
            console.log(e.message);
        }
    }
}
NFT.actions.read = read;

const ethEnabled = async () => {
    if (window.ethereum) {
        NFT.ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        NFT.signer = NFT.ethersProvider.getSigner();

        let accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        ACCOUNT = accounts[0];

        window.ethereum.on('accountsChanged', function (accounts) {
            ACCOUNT = accounts[0];
        });

        await chainSwitchInstall(chainId);
        return true;  
    }  
    return false;
}

async function chainSwitchInstall(chainId){
    if (window.ethereum.networkVersion !== chainId) {
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: window.web3.utils.toHex(chainId) }]
            });
        } catch (err) {
            // This error code indicates that the chain has not been added to MetaMask
            if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                {
                    chainName: blockchains[chainId].chainName,
                    chainId: blockchains[chainId].chainId,
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