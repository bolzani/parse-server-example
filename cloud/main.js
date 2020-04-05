Parse.Cloud.job("update", function (request, status) {
  request.log.info("Iniciando update");
  var url = 'https://confiraloterias.com.br/api0/json.php?token=DwcRCUsPwrjMJbC&loteria=megasena&lista=true&concurso=1';
  Parse.Cloud.httpRequest({
    url: url
  }).then(function (httpResponse) {
    var list = JSON.parse(httpResponse.text);
    list.forEach(obj => {
      saveToParse(obj, request);
    });
    status.success();
  }, function (httpResponse) {
    request.log.error('Update falhou ' + httpResponse.status);
    status.error();
  });
});

Parse.Cloud.afterSave("Megasena", (request) => {
  var concurso = request.object;
  if (request.object.existed()) {
    return;
  }
  Parse.Push.send({
    channels: ["megasena"],
    data: {
      alert: {
        title: "Concurso " + concurso.get("concurso_numero") + " da MegaSena realizado",
        body: "Clique aqui para verificar seus jogos"
      },
      sound: "default"
    }
  }, {
    useMasterKey: true
  });
});

function saveToParse(json, request) {
  var Megasena = Parse.Object.extend("Megasena");
  var query = new Parse.Query(Megasena);
  query.equalTo("concurso_numero", parseInt(json.concurso.numero));
  query.first().then(function (obj) {
    if (obj == null) {
      request.log.info("Criando concurso " + json.concurso.numero);
      obj = newObject(json);
      obj.save();
    } else if (obj.get("completo") == false) {
      request.log.info("Atualizando concurso " + json.concurso.numero);
      obj = updateObject(obj, json);
      obj.save();
    }
  });
}

function newObject(json) {
  var Megasena = Parse.Object.extend("Megasena");
  var concurso = new Megasena();
  return updateObject(concurso, json);
}

function updateObject(object, json) {
  object.set("concurso_numero", parseInt(json.concurso.numero));
  object.set("completo", json.resultado_completo == true);
  object.set("valor_acumulado_final_zero", json.valor_acumulado_final_zero);
  object.set("valor_acumulado_final_cinco", json.valor_acumulado_final_cinco);
  object.set("valor_acumulado_mega_da_virada", json.mega_virada_valor_acumulado);
  object.set("concurso_arrecadacao_total", json.concurso.arrecadacao_total);
  object.set("concurso_cidade", json.concurso.cidade);
  object.set("concurso_data", json.concurso.data);
  object.set("concurso_dezenas", json.concurso.dezenas);
  object.set("concurso_local", json.concurso.local);
  object.set("concurso_valor_acumulado", json.concurso.valor_acumulado);
  object.set("concurso_premiacao_sena_ganhadores", json.concurso.premiacao.sena.ganhadores);
  object.set("concurso_premiacao_sena_valor_pago", json.concurso.premiacao.sena.valor_pago);
  object.set("concurso_premiacao_quina_ganhadores", json.concurso.premiacao.quina.ganhadores);
  object.set("concurso_premiacao_quina_valor_pago", json.concurso.premiacao.quina.valor_pago);
  object.set("concurso_premiacao_quadra_ganhadores", json.concurso.premiacao.quadra.ganhadores);
  object.set("concurso_premiacao_quadra_valor_pago", json.concurso.premiacao.quadra.valor_pago);
  object.set("proximo_data", json.proximo_concurso.data);
  object.set("proximo_valor_estimado", json.proximo_concurso.valor_estimado);
  return object;
}