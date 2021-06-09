var stm = require('stmjs');
var testNet = false;

function stmSimple() {
  this._server = {
    trace : false,
    trusted : true,
    local_signing : true,
    servers : [
      {
        host : 'sa.labs.stream',
        port : 443,
        secure : true
      }
    ],
    connection_offset : 0,
    ping : 10
  };
  if (!testNet)
    this._server.servers = [
      {
        host : 'node.labs.stream',
        port : 443,
        secure : true
      }
    ];
  this._idHost = 'https://id.labs.stream/v1/user/';
  this._native = 'STM';
  this._drops = 1000000;
  this._remote = new stm.Remote(this._server, true);
}



function accMul(num1,num2){

  var m=0,s1=num1.toString(),s2=num2.toString();
  try{
    m+=s1.split(".")[1].length;
  }catch(e){};
    try{
    m+=s2.split(".")[1].length;
  }catch(e){};
    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m);
}
function accDiv(num1,num2){

  if (num1 === undefined || num2 === undefined)
     return undefined;
  var t1,t2,r1,r2;
  try{
    t1 = num1.toString().split('.')[1].length;
  }catch(e){
    t1 = 0;
  }
  try{
    t2=num2.toString().split(".")[1].length;
  }catch(e){
    t2=0;
  }
  r1=Number(num1.toString().replace(".",""));
  r2=Number(num2.toString().replace(".",""));
  return (r1/r2)*Math.pow(10,t2-t1);
}

//srcAccount:{account,secret}
//destAddressAndAmount:{account,amount:{value,currency,issuer},memo}
stmSimple.send = function(srcAccount,destAddressAndAmount,callback){

  var ss = new stmSimple();
  var result = {};
  result.tx = {
    from: srcAccount.account,
    to: destAddressAndAmount.account,
    amount: {
      value : destAddressAndAmount.amount.value,
      currency: destAddressAndAmount.amount.currency,
      issuer: destAddressAndAmount.amount.issuer
    }
  };

  if (!stm.UInt160.is_valid(String(srcAccount.account))){
    result.state = "error";
    result.msg = "src address is invalid";
    var err  = new Error('src address is invalid');
    return callback(err,result);
  }
  if (!stm.UInt160.is_valid(String(destAddressAndAmount.account))){
    result.state = "error";
    result.msg = "dest address is invalid";
    var err  = new Error('dest address is invalid');
    return callback(err,result);
  }

  if (destAddressAndAmount.amount.currency === ss._native) {
    var amount = accMul(destAddressAndAmount.amount.value, ss._drops);
  } else {
      //prepare the transaction
      var amount = {};
      amount.currency = destAddressAndAmount.amount.currency;
      amount.value = String(destAddressAndAmount.amount.value);
      amount.issuer = destAddressAndAmount.account;
      var sendMax = {
        currency : destAddressAndAmount.amount.currency,
        issuer : destAddressAndAmount.amount.issuer,
        value : String(accMul(destAddressAndAmount.amount.value, 1.2))
      };
    }

    ss._remote.connect();
    ss._remote.setSecret(srcAccount.account, srcAccount.secret);
    var transaction = ss._remote.createTransaction('Payment', {
        account : srcAccount.account,
        destination : destAddressAndAmount.account,
        amount : amount
    });
    if(!!destAddressAndAmount.memo)
      transaction.addMemo(encodeURI('memo'), encodeURI(destAddressAndAmount.memo));
    if (!!sendMax) {
      transaction.sendMax(sendMax);
    }
    //set last ledger
    transaction.lastLedger(ss._remote._ledger_current_index + 3);
    //submit the transaction
    transaction.submit(function (error, raw) {
      ss._remote.disconnect();
      if (error){
        console.log(error);
        var err = new Error(error.engine_result_message);
        result.state = 'error';
        result.engine_result = error.engine_result;
        result.msg = error.engine_result_message;
        return callback(err,result);
      }else{
        result.msg = 'success';
        result.engine_result = raw.engine_result;
        result.msg = raw.engine_result_message;
        return callback(null,result);
      }
    });
  }

stmSimple.getTrustLines = function (address, callback) {

  if (!stm.UInt160.is_valid(String(address))){
    var err  = new Error('address is invalid');
    return callback(err,false);
  }

  var ss = new stmSimple();
  ss._remote.connect();

  ss._remote.requestAccountLines(address, function parseAccountTx(err, res) {
    ss._remote.disconnect();
    if (err)
      return callback(err, false);
    var trustLines = [];
    var trustLinesResult = {account:address};
    if (!!res.lines){
      res.lines.forEach(function(line){
        var trustLine = {
          issuer: line.account,
          balance: line.balance,
          currency: line.currency,
          limit: line.limit
        };
        trustLines.push(trustLine);
      });
    }
    trustLinesResult.trustLines = trustLines;
    return callback(null,trustLinesResult);
  });
}

stmSimple.getBalance = function (address, callback) {

  if (!stm.UInt160.is_valid(String(address))){
    var err  = new Error('address is invalid');
    return callback(err,false);
  }

  var ss = new stmSimple();
  ss._remote.connect();
  var result = {
    account: address
  };
  ss._remote.requestAccountInfo(address, function parseAccountInfo(err, res) {
    ss._remote.disconnect();

    if (err){
      console.log(err);
      return callback(err, false);
    }
    if (!!res.account_data)
      result.balance = accDiv(res.account_data.Balance, ss._drops)
    return callback(null,result);
  });
}


stmSimple.getHistory = function (address, callback) {

  if (!stm.UInt160.is_valid(String(address))){
    var err  = new Error('address is invalid');
    return callback(err,false);
  }

  var ss = new stmSimple();
  ss._remote.connect();

  var options = {
    account : address,
    ledger_index_min : -1
  };

  ss._remote.requestAccountTx(options, function parseAccountTx(err, data) {
    ss._remote.disconnect();
    if (err)
      return callback(err, false);
    if (data.transactions) {
      var result = {account:address,ledger_index_max:data.ledger_index_max};
      var transactions = [];
      data.transactions.forEach(function (e) {
        var tx = processTxn(e.tx, e.meta, address);
        if(!!tx && (tx.type == 'sent' || tx.type == 'received'))
          transactions.push(tx);
      });
      result.transactions = transactions;
      callback(null,result);

    }
  });
}

stmSimple.getHistoryFromLedger = function (address, ledger_index_min,callback) {

  if (!stm.UInt160.is_valid(String(address))){
    var err  = new Error('address is invalid');
    return callback(err,false);
  }

  var ss = new stmSimple();
  ss._remote.connect();

  var options = {
    account : address,
    ledger_index_min : ledger_index_min
  };

  ss._remote.requestAccountTx(options, function parseAccountTx(err, data) {
    ss._remote.disconnect();
    if (err)
      return callback(err, false);
    if (data.transactions) {
      var result = {account:address,ledger_index_max:data.ledger_index_max};
      var transactions = [];
      data.transactions.forEach(function (e) {
        var tx = processTxn(e.tx, e.meta, address);
        if(!!tx && (tx.type == 'sent' || tx.type == 'received'))
          transactions.push(tx);
      });
      result.transactions = transactions;
      callback(null,result);

    }
  });
}

function processTxn(tx, meta, address) {
  var obj = {};
  var ss = new stmSimple();
  // Currency balances that have been affected by the transaction
  var affected_currencies = [];
  // Main transaction
  if (tx.Account === address
     || (tx.Destination && tx.Destination === address)) {
    if ('tesSUCCESS' === meta.TransactionResult && tx.TransactionType === 'Payment') {
      var counterparty;
      obj.hash = tx.hash;
      obj.date = tx.date;
      obj.timestamp = new Date(stm.utils.toTimestamp(tx.date));
      obj.type = '';
      obj.account = address;
      if (tx.Account === address) {
        if (tx.Destination === address) {
          obj.type = 'exchange';
          obj.spent = stm.Amount.from_json(tx.SendMax);
        } else {
          obj.type = 'sent';
          obj.counterparty = tx.Destination;
          counterparty = tx.Destination;
        }
      } else {
        obj.type = 'received';
        obj.counterparty = tx.Account;
        counterparty = tx.Account;
      }
      if (meta.delivered_amount.currency) {
        obj.amount = Number(meta.delivered_amount.value);
        obj.currency = meta.delivered_amount.currency;
      } else {
        obj.amount = accDiv(meta.delivered_amount, ss._drops);
        obj.currency = ss._native;
      }

      meta.AffectedNodes.forEach(function(affectedNode){
        if (!!affectedNode.ModifiedNode && affectedNode.ModifiedNode.LedgerEntryType == 'VStreamState'
            &&(affectedNode.ModifiedNode.FinalFields.HighLimit.issuer==counterparty || affectedNode.ModifiedNode.FinalFields.LowLimit.issuer==counterparty)
            && affectedNode.ModifiedNode.FinalFields.Balance.currency == obj.currency){
            if (affectedNode.ModifiedNode.FinalFields.HighLimit.issuer==counterparty)
              obj.issuer = affectedNode.ModifiedNode.FinalFields.LowLimit.issuer;
            else
              obj.issuer = affectedNode.ModifiedNode.FinalFields.HighLimit.issuer;
        }
      });
      if (tx.DestinationTag) {
        obj.DestinationTag = String(tx.DestinationTag);
      }
      if (tx.Memos && tx.Memos[0]) {
        var utils = stm.utils;
        var data = decodeURI(utils.hexToString(tx.Memos[0].Memo.MemoData));
        if (!!data)
          obj.memoData = data;
      }
    }
  }
  return obj;
}

exports.stmSimple = stmSimple;
