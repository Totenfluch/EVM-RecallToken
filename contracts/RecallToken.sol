// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
    @title ERC-ERC4242 Recall Tracing Token
    @dev See https://eips.ethereum.org/EIPS/eip-ERC4242
    @notice This contract represents a recall tracing token standard that allows manufacturers, distributors, and customers
            to announce defects, check tokens, and forward recalls based on unique product IDs (TokenIDs). 
            It enables efficient traceability and communication within a product supply chain.
 */

contract RecallToken is ERC1155, Ownable {
    /** @dev 
        The `_announcer` argument MUST be the address of an account/contract that currently owns the token
        The `_tokenId` argument MUST be the token being announced defect
    */
    event DefectAnnounced(address indexed _announcer, uint256 _tokenId);

    /** @dev 
        The `_announcer` argument MUST be the address of an account/contract approved to manage the tokens
        The `_tokenIds` argument MUST be the tokens being announced defect    
    */
    event ForwardRecall(address indexed _announcer, uint256[] _tokenIds);

    /** @dev 
        The `_announcer` argument MUST be the address of an account/contract approved to manage the token
        The `_tokenId` argument MUST be the token being announced defect
        The `_resultState` argument must be {CHECKED_NO_DEFECT, CHECKED_DEFECT}
    */
    event TokenChecked(address indexed _announcer, uint256 _tokenId, TokenCheckingState _resultState);
    
    enum TokenState {OK, ON_HOLD, NOT_OK}

    enum TokenCheckingState {NONE, PLEASE_CHECK, CHECKED_NO_DEFECT, CHECKED_DEFECT}

    address[] manufacturers;

    mapping(address => mapping(uint256 => TokenCheckingState)) manufacturerTokenCheckingStates;

    mapping(uint256 => TokenCheckingState) public tokenCheckingStates;

    mapping(uint256 => TokenState) public tokenStates;

    mapping(uint256 => bool) public inProduction;

    modifier _isManufacturer {
        bool tempIsManufacturer = false;
        for (uint i = 0; i < manufacturers.length; i++) {
            if (msg.sender == manufacturers[i]) {
                tempIsManufacturer = true;
                break;
            }
        }

        require(tempIsManufacturer == true, "Must be Manufacturer");
        _;
    }

    constructor(string memory uri) ERC1155(uri) {

    }

    /**
        @notice Changes the `TokenState` for a token specified by `_tokenId` to `{NOT_OK}`
        @dev Caller must be approved to manage the token
        MUST revert if TokenState of `_tokenId` is {ON_HOLD, NOT_OK}.
        MUST revert on any other error.
        MUST emit the `DefectAnnounced` event to reflect the TokenState change     
        @param _tokenId   The defect Token
    */
    function announceDefect(uint256 _tokenId) public {
        emit DefectAnnounced(msg.sender, _tokenId);
        bool isManufacturer = false;
        uint selectedManufacturer = 0;
        for (uint i = 0; i < manufacturers.length; i++) {
            if (msg.sender == manufacturers[i]) {
                isManufacturer = true;
                selectedManufacturer = i;
                break;
            }
        }
        if (isManufacturer) {
            tokenStates[_tokenId] = TokenState.NOT_OK;
            return;
        } else {
            tokenStates[_tokenId] = TokenState.ON_HOLD;
        }

        for (uint i = 0; i < manufacturers.length; i++) {
            manufacturerTokenCheckingStates[manufacturers[i]][_tokenId] = TokenCheckingState.PLEASE_CHECK;
        } 
    }

    /**
        @notice Changes the `TokenCheckingState` for a token specified by `_tokenId` to `_tokenCheckingState`
        @dev Caller must be approved to manage the token
        MUST revert if `TokenCheckingState` of `_tokenId` is `{NONE, CHECKED_NO_DEFECT, CHECKED_DEFECT}`.
        MUST revert on any other error.
        MUST emit the `TokenChecked` event to reflect the TokenCheckingState change     
        @param _tokenId             The defect Token
        @param _tokenCheckingState  Result state of the check
    */
    function checkToken(uint256 _tokenId, TokenCheckingState _tokenCheckingState) _isManufacturer public {
        uint selectedManufacturer = 0;
        for (uint i = 0; i < manufacturers.length; i++) {
            if (msg.sender == manufacturers[i]) {
                selectedManufacturer = i;
                break;
            }
        }
        manufacturerTokenCheckingStates[msg.sender][_tokenId] = _tokenCheckingState;
    }

    /**
        @notice Changes the `TokenState` for all token specified by `_tokenIds` to `{NOT_OK}`
        @dev Caller must be approved to manage the tokens
        MUST revert on any other error.
        MUST emit the `ForwardRecall` event to reflect the TokenState change     
        @param _tokenIds           The defect Token
    */
    function forwardRecall(uint256[] calldata _tokenIds) public {
        emit ForwardRecall(msg.sender, _tokenIds);
        for (uint i = 0; i < _tokenIds.length; i ++) {
            tokenStates[_tokenIds[i]] = TokenState.NOT_OK;
        }
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     * if _internal is true, receiver will be added as manufacturer, otherwise not
     * after _internal is set false for one transfer, receivers will no longer be added as manufacturers
     */
    function transferRecallToken(address _receiver, uint256 _tokenId, uint256 amount, bytes memory data, bool _internal) public {
        if (inProduction[_tokenId] && _internal) {
            manufacturers.push(_receiver);
        }
        if (!_internal && !inProduction[_tokenId]) {
            inProduction[_tokenId] = false;
        }
        safeTransferFrom(msg.sender, _receiver, _tokenId, amount, data);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     * if _internal is true, receiver will be added as manufacturer, otherwise not
     * after _internal is set false for one transfer, receivers will no longer be added as manufacturers
     */
    function batchTransferRecallToken(address _receiver, uint256[] calldata _tokenIds, uint256[] calldata _amounts, bytes memory data, bool _internal) public {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            if (inProduction[_tokenIds[i]] && _internal) {
                manufacturers.push(_receiver);
            }
            if (!_internal && !inProduction[_tokenIds[i]]) {
                inProduction[_tokenIds[i]] = false;
            }
        }
        safeBatchTransferFrom(msg.sender, _receiver, _tokenIds, _amounts, data);
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function mint(address to, uint256 id, uint256 amount, bytes memory data) onlyOwner public {
        _mint(to, id, amount, data);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_mint}.
     *
     * Emits a {TransferBatch} event.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) onlyOwner public {
        _mintBatch(to, ids, amounts, data);
    }
}