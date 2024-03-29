pragma solidity ^0.8.19;

/**
    @title ERC-ERC4242 Recall Tracing Token
    @dev See https://eips.ethereum.org/EIPS/eip-ERC4242
    Note: The ERC-165 identifier for this interface is 0xd9b67a26.
 */
/* is ERC1155 */ interface ERCxxxx {
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
        The `_resultState` argument must be {CHECKED_OK, CHECKED_NOT_OK}
    */
    event TokenChecked(
        address indexed _announcer,
        uint256 _tokenId,
        TokenCheckingState _resultState
    );

    /** @dev 
        The `_announcer` argument MUST be the address of an account/contract approved to manage the token
        The `_tokenId` argument MUST be the token that the manufacturers are merged into
        The `_mergedTokenId` MUST be the token that the manufacturers are sourced from
    */
    event TokenMerged(
        address indexed _announcer,
        uint256 _tokenId,
        uint256 _mergedTokenId
    );

    enum TokenState {
        OK,
        ON_HOLD,
        NOT_OK
    }

    enum TokenCheckingState {
        NONE,
        CHECK_REQUESTED,
        CHECKED_OK,
        CHECKED_NOT_OK
    }

    /**
        @notice Changes the `TokenState` for a token specified by `_tokenId` to `{NOT_OK}`
        @dev Caller must be approved to manage the token
        MUST revert if TokenState of `_tokenId` is {ON_HOLD, NOT_OK}.
        MUST revert on any other error.
        MUST emit the `DefectAnnounced` event to reflect the TokenState change     
        @param _tokenId   The defect Token
    */
    function announceDefect(uint256 _tokenId) external;

    /**
        @notice Changes the `TokenCheckingState` for a token specified by `_tokenId` to `_tokenCheckingState`
        @dev Caller must be approved to manage the token
        MUST revert if `TokenCheckingState` of `_tokenId` is `{NONE, CHECKED_OK, CHECKED_NOT_OK}`.
        MUST revert on any other error.
        MUST emit the `TokenChecked` event to reflect the TokenCheckingState change     
        @param _tokenId             The defect Token
        @param _tokenCheckingState  Result state of the check
    */
    function checkToken(
        uint256 _tokenId,
        TokenCheckingState _tokenCheckingState
    ) external;

    /**
        @notice Changes the `TokenState` for all token specified by `_tokenIds` to `{NOT_OK}`
        @dev Caller must be approved to manage the tokens
        MUST revert on any other error.
        MUST emit the `ForwardRecall` event to reflect the TokenState change     
        @param _tokenIds           The defect Token
    */
    function forwardRecall(uint256[] calldata _tokenIds) external;

    /** @dev 
        The `_tokenIdMergeTo` argument MUST be the token that the manufacturers are merged into
        The `_tokenIdMergeSource` MUST be the token that the manufacturers are sourced from
    */
    function mergeToken(uint256 _tokenIdMergeTo, uint256 _tokenIdMergeSource) external;

    /** @dev 
        The `_tokenContractAddress` MUST be a ERCxxx contract
        The `_tokenIdMergeTo` argument MUST be the token that the manufacturers are merged into
        The `_tokenIdMergeSource` MUST be the token that the manufacturers are sourced from
    */
    function mergeExternalToken(address _tokenContractAddress, uint256 _tokenIdMergeTo, uint256 _tokenIdMergeSource) external;
}
