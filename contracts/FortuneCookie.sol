// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/// @author: SamuelMulqueen
import '../@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '../@openzeppelin/contracts/access/Ownable.sol';
import '../@openzeppelin/contracts/utils/Strings.sol';
import '../@openzeppelin/contracts/utils/Base64.sol';

contract FortuneCookie is ERC721Enumerable, Ownable {
    using Strings for uint256;
    using Strings for int256;
    
    uint256 private _tokenID;

    string internal cookieSVG;
    string internal cookieOpenedSVG;

    mapping(uint256 => string) private tokenSecretMessages;
    mapping(uint256 => string) internal standardMessages;

    uint256 internal _numStandardMessages;

    uint256 public _totalSupply;
    uint256 public priceStandard;
    uint256 public priceCustom;
    uint256 public maxMessageLength;
    uint256 public maxMintQuantity;
    
    uint256 public numStandardMinted;
    uint256 public numCustomMinted;
    uint256 public numTotalMinted;

    uint256 public totalOpened;

    mapping(uint256 => NFT) public tokens;

    bool public pausedMint;

    struct NFT{
        uint256 tokenID;
        bool minted;
        uint createdAt;
        address createdBy;
        bool open;
        uint openedAt;
        address openedBy;
    }

    constructor(uint256 supply, uint256 _priceStandard, uint256 _priceCustom, uint256 maxLength, uint256 maxQuantity)
		ERC721('Fortune Cookie', '$COOKIE')
	{
        _totalSupply = supply;
        priceStandard = _priceStandard;
        priceCustom = _priceCustom;
        maxMessageLength = maxLength;
        maxMintQuantity = maxQuantity;
        pausedMint = true;
        cookieSVG = unicode'<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" overflow="visible"><filter id="soften"><feGaussianBlur in="SourceGraphic" stdDeviation="7" /></filter><filter id="shadowblur"><feGaussianBlur in="SourceGraphic" stdDeviation="30" /></filter><g transform-origin="50% 50%" transform="scale(0.5,0.5)" filter="url(#soften)"><rect filter="url(#shadowblur)" width="100%" height="25%" transform="translate(0,2000)" transform-origin="50% 50%" rx="50%" fill="rgba(0,0,0,0.25)"/><text x="50%" y="50%" font-size="2048px" dominant-baseline="middle" text-anchor="middle" style="user-select:none" draggable="false">🥠</text></g></svg>';
        cookieOpenedSVG = unicode'<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" overflow="visible"><defs><clipPath id="clip-0"><ellipse style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" cx="2402.994" cy="1901.495" rx="1094.996" ry="1043.113"></ellipse></clipPath><clipPath id="clip-1"><ellipse style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" cx="807.253" cy="2185.262" rx="1094.996" ry="1043.113"></ellipse></clipPath><clipPath id="clip-2"><ellipse style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" cx="119.125" cy="1049.529" rx="1094.996" ry="1043.113"></ellipse></clipPath></defs><filter id="soften"><feGaussianBlur in="SourceGraphic" stdDeviation="7"></feGaussianBlur></filter><filter id="shadowblur"><feGaussianBlur in="SourceGraphic" stdDeviation="30"></feGaussianBlur></filter><g transform-origin="50% 50%" transform="scale(0.5,0.5)" filter="url(#soften)"><rect filter="url(#shadowblur)" width="2675.881" height="206.75" transform-origin="50% 50%" rx="800" fill="rgba(0,0,0,0.25)" style="" y="2000" x="-152.917"></rect><text x="910.849" y="2079.205" font-size="2048px" dominant-baseline="middle" text-anchor="middle" style="user-select: none; white-space: pre; clip-path: url(#clip-2); font-size: 2048px;" draggable="false">🥠</text><text x="1746.601" y="1676.078" font-size="2048px" dominant-baseline="middle" text-anchor="middle" style="user-select: none; white-space: pre; font-size: 2048px; clip-path: url(#clip-1);" draggable="false">🥠</text><text x="1570.142" y="1681.761" font-size="2048px" dominant-baseline="middle" text-anchor="middle" style="user-select: none; white-space: pre; font-size: 2048px; clip-path: url(#clip-0);" draggable="false">🥠</text></g></svg>';
    }

    /*/
    /// External onlyOwner Methods
    /*/

    function togglePauseMint() external onlyOwner {
        pausedMint = !pausedMint;
    }
    function setMaxMessageLength(uint256 length) external onlyOwner {
        maxMessageLength = length;
    }
    function setTotalSupply(uint256 supply) external onlyOwner {
        require(supply >= _tokenID, 'New supply must be more than number minted');
        _totalSupply = supply;
    }
    function setPriceStandard(uint256 newPrice) external onlyOwner {
        priceStandard = newPrice;
    }
    function setPriceCustom(uint256 newPrice) external onlyOwner {
        priceCustom = newPrice;
    }

    function withdraw() external onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed.");
    }

    function addStandardMessage(string calldata message) external onlyOwner {
        standardMessages[_numStandardMessages++] = message;
    }
    function addManyStandardMessages(string[] calldata messages) external onlyOwner {
        for(uint256 i = 0; i<messages.length; i++){
            standardMessages[_numStandardMessages++] = messages[i];
        }
    }
    function numStandardMessages() public view onlyOwner returns(uint){
        return _numStandardMessages;
    }

    function updateCookieSVG(string calldata svg_code) external onlyOwner {
        cookieSVG = svg_code;
    }
    function updateCookieOpenedSVG(string calldata svg_code) external onlyOwner {
        cookieOpenedSVG = svg_code;
    }
    /*/
    /// public methods
    /*/
    function burn(uint256 tokenID) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenID), "FortuneCookie: caller is not owner nor approved");
        _burn(tokenID);
    }
    function tokenCount() public view returns(uint){
        return _tokenID;
    }
    function totalSupply() public view override returns(uint){
        return _totalSupply;
    }
    function isCookieOpened(uint256 tokenID) public view returns(bool){
        require(tokenID < _tokenID && tokens[tokenID].minted, 'Token does not exist');
        return tokens[tokenID].open;
    }
    function generateSVG(bool opened) public view returns(string memory){
        bytes memory svg = abi.encodePacked(opened ? cookieOpenedSVG : cookieSVG);
        return string(
            abi.encodePacked(
                bytes("data:image/svg+xml;base64,"),
                Base64.encode(svg)
            )    
        );
    }
    function tokenURI(uint256 token) public override view returns (string memory){
        require(tokens[token].minted == true, 'token does not exist with the given token ID');
        NFT storage nft = tokens[token];
        bytes memory dataURI = abi.encodePacked(
            '{\n',
                '\t"name": "Fortune Cookie #', token.toString(), '",\n',
                '\t"description": "','A crisp cookie shell, containing a secret message inside.','",\n',
                '\t"image_data": "', string(generateSVG(nft.open)), '",\n',
                '\t"attributes": [ \n',
                string.concat(
                    (nft.open? '\t\t{ "value": "Fortune Revealed" },\n' : '\t\t{ "value": "Mystery Within"},\n'),
                    (nft.open ? string.concat('\t\t{ "trait_type": "Opened At", "value": "',Strings.toString(nft.openedAt),'", "display_type": "date"},\n') : ''),
                    '\t\t{ "trait_type": "Created At", "value": "',Strings.toString(nft.createdAt),'", "display_type": "date" }\n'
                ),
                '\t]',
            '\n}'
        );
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }
    

    /*/
    /// internal Methods
    /*/
    function strlen(string memory s) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }
    function random(uint number) internal view returns(uint){
        return uint(keccak256(abi.encodePacked(block.timestamp, _tokenID,
        msg.sender))) % number;
    }

    /*/
    /// private functions
    /*/

    function _nextTokenID() private returns(uint256){
        return _tokenID++;
    }

    function _setToken(uint256 tokenID, NFT memory token) private {
        tokens[tokenID].tokenID = tokenID;
        tokens[tokenID].minted = token.minted;
        tokens[tokenID].createdAt = token.createdAt;
        tokens[tokenID].createdBy = token.createdBy;
        tokens[tokenID].open = token.open;
        tokens[tokenID].openedAt = token.openedAt;
        tokens[tokenID].openedBy = token.openedBy;
    }

    function _mintStandard(address minter) private {
        
        uint256 tokenID = _tokenID;
        
        NFT memory token;
        token.minted = true;
        token.open = false;
        token.createdBy = minter;
        token.createdAt = block.timestamp;

        tokenSecretMessages[tokenID] = standardMessages[random(_numStandardMessages)];
        
        _safeMint(minter, tokenID);
        _setToken(tokenID, token);
        _nextTokenID();

        numStandardMinted++;
        numTotalMinted++;
    }

    function _mintCustom(address minter, string memory message) private {
        uint256 tokenID = _tokenID;
        
        NFT memory token;
        token.minted = true;
        token.open = false;
        token.createdBy = minter;
        token.createdAt = block.timestamp;

        tokenSecretMessages[tokenID] = message;

        _safeMint(minter, tokenID);
        _setToken(tokenID, token);
        _nextTokenID();

        numStandardMinted++;
        numTotalMinted++;
    }

    /*/
    /// external methods
    /*/
    function mint(uint256 quantity) 
    external
    payable
    ensureAvailability(quantity)
    validateEthPayment(false, quantity)
	{
        require(!pausedMint, 'minting is currently paused');
        for(uint i=0; i<quantity; i++){
            _mintStandard(msg.sender);
        }
    }
    function mintCustom(uint256 quantity, string memory message) 
    external
    payable
    ensureAvailability(quantity)
    validateEthPayment(true, quantity)
	{
        require(!pausedMint, 'minting is currently paused');
        require(strlen(message) <= maxMessageLength, 'message is longer than maximum length');
        for(uint i=0; i<quantity; i++){
            _mintCustom(msg.sender, message);
        }
    }
    function open(uint256 tokenID) external {
        require(tokens[tokenID].minted == true, 'This token does not exist');
        require(ownerOf(tokenID) == msg.sender, 'You must be the owner this token to crack open the fortune cookie');
        require(tokens[tokenID].open == false, 'This fortune cookie has already been opened');
        tokens[tokenID].open = true;
        tokens[tokenID].openedAt = block.timestamp;
        tokens[tokenID].openedBy = _msgSender();
        totalOpened++;
    }
    function read(uint256 tokenID) external view returns (string memory){
        require(tokens[tokenID].minted == true, 'This token does not exist');
        require(ownerOf(tokenID) == msg.sender, 'You must be the owner this token to read the message');
        require(tokens[tokenID].open == true, 'You must crack open the fortune cookie before you can read the message');
        return tokenSecretMessages[tokenID];
    }
    //*/

    /*/
    /// modifiers
    /*/

    modifier ensureAvailability(uint256 quantity) {
        require(quantity > 0, "quantity cannot be zero");
        require(quantity <= maxMintQuantity, "quantity more than max allowed");
        require(_tokenID + quantity <= _totalSupply, "less than quantity available in total supply");
		_;
	}

    modifier validateEthPayment(bool custom, uint256 quantity) {
        uint256 mintPrice_ = custom ? priceCustom : priceStandard;
		require(
			mintPrice_ * quantity <= msg.value,
			'Ether value sent is insufficient'
		);
		_;
	}

}