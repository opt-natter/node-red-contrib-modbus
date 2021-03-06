/**
 Copyright (c) 2016,2017,2018 Klaus Landsdorf (http://bianco-royal.de/)
 All rights reserved.
 node-red-contrib-modbus - The BSD 3-Clause License

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 **/
'use strict'
// SOURCE-MAP-REQUIRED

var de = de || { biancoroyal: { modbus: { basics: {} } } } // eslint-disable-line no-use-before-define
de.biancoroyal.modbus.basics.internalDebug = de.biancoroyal.modbus.basics.internalDebug || require('debug')('contribModbus:basics') // eslint-disable-line no-use-before-define
de.biancoroyal.modbus.basics.util = de.biancoroyal.modbus.basics.util || require('util') // eslint-disable-line no-use-before-define

/**
 * Modbus core node basics.
 * @module NodeRedModbusBasics
 */
de.biancoroyal.modbus.basics.statusLog = false
/**
 *
 * @param unit
 * @returns {string}
 */
de.biancoroyal.modbus.basics.get_timeUnit_name = function (unit) {
  let unitAbbreviation = ''

  switch (unit) {
    case 'ms':
      unitAbbreviation = 'msec.'
      break
    case 's':
      unitAbbreviation = 'sec.'
      break
    case 'm':
      unitAbbreviation = 'min.'
      break
    case 'h':
      unitAbbreviation = 'h.'
      break
    default:
      break
  }

  return unitAbbreviation
}

de.biancoroyal.modbus.basics.calc_rateByUnit = function (rate, rateUnit) {
  switch (rateUnit) {
    case 'ms':
      break
    case 's':
      rate = parseInt(rate) * 1000 // seconds
      break
    case 'm':
      rate = parseInt(rate) * 60000 // minutes
      break
    case 'h':
      rate = parseInt(rate) * 3600000 // hours
      break
    default:
      rate = 10000 // 10 sec.
      break
  }

  return rate
}
/**
 *
 * @param statusValue
 * @param showActivities
 * @returns {{fill: string, shape: string, status: *}}
 */
de.biancoroyal.modbus.basics.setNodeStatusProperties = function (statusValue, showActivities) {
  let fillValue = 'yellow'
  let shapeValue = 'ring'

  switch (statusValue) {
    case 'connecting':
      fillValue = 'yellow'
      shapeValue = 'ring'
      break

    case 'error':
      fillValue = 'red'
      shapeValue = 'ring'
      break

    case 'initialized':
      fillValue = 'yellow'
      shapeValue = 'dot'
      break

    case 'not ready to read':
    case 'not ready to write':
      fillValue = 'yellow'
      shapeValue = 'ring'
      break

    case 'connected':
      fillValue = 'green'
      shapeValue = 'ring'
      break

    case 'timeout':
      fillValue = 'red'
      shapeValue = 'ring'
      break

    case 'active':
    case 'active reading':
    case 'active writing':
      if (!showActivities) {
        statusValue = 'active'
      }
      fillValue = 'green'
      shapeValue = 'dot'
      break

    case 'disconnected':
    case 'terminated':
      fillValue = 'red'
      shapeValue = 'ring'
      break

    case 'polling':
      fillValue = 'green'
      if (showActivities) {
        shapeValue = 'ring'
      } else {
        statusValue = 'active'
        shapeValue = 'dot'
      }
      break

    default:
      if (!statusValue || statusValue === 'waiting') {
        fillValue = 'blue'
        statusValue = 'waiting ...'
      }
      break
  }

  return { fill: fillValue, shape: shapeValue, status: statusValue }
}

de.biancoroyal.modbus.basics.setNodeStatusByResponseTo = function (statusValue, response, node) {
  let fillValue = 'red'
  let shapeValue = 'dot'

  switch (statusValue) {
    case 'initialized':
      fillValue = 'green'
      shapeValue = 'ring'
      break

    case 'active':
      fillValue = 'green'
      shapeValue = 'dot'
      break

    default:
      if (!statusValue || statusValue === 'waiting') {
        fillValue = 'blue'
        statusValue = 'waiting ...'
      }
      break
  }

  node.status({ fill: fillValue, shape: shapeValue, text: this.util.inspect(response, false, null) })
}

de.biancoroyal.modbus.basics.setNodeStatusResponse = function (length, node) {
  node.status({
    fill: 'green',
    shape: 'dot',
    text: 'active got length: ' + length
  })
}

de.biancoroyal.modbus.basics.setModbusError = function (node, modbusClient, err, msg) {
  if (err) {
    switch (err.message) {
      case 'Timed out':
        this.setNodeStatusTo('timeout', node)
        break
      case 'FSM Not Ready To Reconnect':
        this.setNodeStatusTo('not ready to reconnect', node)
        break
      case 'Port Not Open':
        this.setNodeStatusTo('reconnect', node)
        modbusClient.emit('reconnect')
        break
      default:
        this.internalDebug(err.message)
        if (node.showErrors) {
          this.setNodeStatusTo('error ' + err.message, node)
          node.error(err, msg)
        }
    }
  }
}

de.biancoroyal.modbus.basics.setNodeStatusTo = function (statusValue, node) {
  let statusOptions = this.setNodeStatusProperties(statusValue, node.showStatusActivities)

  node.status({
    fill: statusOptions.fill,
    shape: statusOptions.shape,
    text: statusOptions.status
  })
}

de.biancoroyal.modbus.basics.onModbusInit = function (node) {
  this.setNodeStatusTo('initialize', node)
}

de.biancoroyal.modbus.basics.onModbusConnect = function (node) {
  this.setNodeStatusTo('connected', node)
}

de.biancoroyal.modbus.basics.onModbusActive = function (node) {
  this.setNodeStatusTo('active', node)
}

de.biancoroyal.modbus.basics.onModbusError = function (node, failureMsg) {
  this.setNodeStatusTo('failure', node)
  if (node.showErrors) {
    node.warn(failureMsg)
  }
}

de.biancoroyal.modbus.basics.onModbusClose = function (node) {
  this.setNodeStatusTo('closed', node)
}

de.biancoroyal.modbus.basics.onModbusBroken = function (node, modbusClient) {
  this.setNodeStatusTo('reconnecting after ' + modbusClient.reconnectTimeout + ' msec.', node)
}

de.biancoroyal.modbus.basics.initModbusClientEvents = function (node, modbusClient) {
  modbusClient.on('mbinit', () => { this.onModbusInit(node) })
  modbusClient.on('mbconnected', () => { this.onModbusConnect(node) })
  modbusClient.on('mbactive', () => { this.onModbusActive(node) })
  modbusClient.on('mberror', (failureMsg) => { this.onModbusError(node, failureMsg) })
  modbusClient.on('mbbroken', () => { this.onModbusBroken(node, modbusClient) })
  modbusClient.on('mbclosed', () => { this.onModbusClose(node) })
}

de.biancoroyal.modbus.basics.invalidPayloadIn = function (msg) {
  return !(msg && msg.hasOwnProperty('payload'))
}

module.exports = de.biancoroyal.modbus.basics
