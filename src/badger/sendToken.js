/*
  Send tokens of type TOKENID to user with SLPADDR address.
*/
import getSlpInstance from './getSlpInstance'

// Set NETWORK to either testnet or mainnet
const NETWORK = process.env.REACT_APP_NETWORK

// Used for debugging and investigating JS objects.
const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

// Instantiate SLP based on the network.
const SLP = getSlpInstance(NETWORK)

export async function sendToken (walletInfo, { tokenId, address, quantity }) {
  try {
    const mnemonic = walletInfo.mnemonic

    // root seed buffer
    const rootSeed = SLP.Mnemonic.toSeed(mnemonic)
    // master HDNode
    let masterHDNode
    if (NETWORK === 'mainnet') masterHDNode = SLP.HDNode.fromSeed(rootSeed)
    else masterHDNode = SLP.HDNode.fromSeed(rootSeed, 'testnet') // Testnet

    // HDNode of BIP44 account
    const account = SLP.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")

    const change = SLP.HDNode.derivePath(account, '0/0')

    // get the cash address
    const cashAddress = SLP.HDNode.toCashAddress(change)
    const slpAddress = SLP.HDNode.toSLPAddress(change)

    const fundingAddress = slpAddress
    const fundingWif = SLP.HDNode.toWIF(change) // <-- compressed WIF format
    const tokenReceiverAddress = address
    const bchChangeReceiverAddress = cashAddress

    // Create a config object for minting
    const sendConfig = {
      fundingAddress,
      fundingWif,
      tokenReceiverAddress,
      bchChangeReceiverAddress,
      tokenId,
      amount: quantity
    }

    // console.log(`createConfig: ${util.inspect(createConfig)}`)

    // Generate, sign, and broadcast a hex-encoded transaction for sending
    // the tokens.
    const sendTxId = await SLP.TokenType1.send(sendConfig)

    console.log(`sendTxId: ${util.inspect(sendTxId)}`)

    console.log('\nView this transaction on the block explorer:')
    let link
    if (NETWORK === 'mainnet') {
      link = `https://explorer.bitcoin.com/bch/tx/${sendTxId}`
    } else {
      link = `https://explorer.bitcoin.com/tbch/tx/${sendTxId}`
    }
    console.log(link)

    return link
  } catch (err) {
    console.error('Error in sendToken: ', err)
    console.log(`Error message: ${err.message}`)
    throw err
  }
}
