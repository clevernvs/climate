
$(function() {

// *** APIs ***
// clima, previsão 12 horas e previsão 5 dias: https://developer.accuweather.com/apis
// pegar coordenadas geográficas pelo nome da cidade: https://docs.mapbox.com/api/
// pegar coordenadas do IP: http://www.geoplugin.net
// gerar gráficos em JS: https://www.highcharts.com/demo

    const accuweatherAPIKey = "OSYW7QE31T10mQ5KXcwdsuEW7b5g3w6A";
    const mapboxToken = "pk.eyJ1IjoiY2xldmVybnZzIiwiYSI6ImNrdnNzam5ycTBnY2gydXBwYzBidnNneWcifQ.ErZYVZd3gcBFjN8SMeIyLw";

    var weatherObject = {
        cidade: "",
        estado: "",
        pais: "",
        temperatura: "",
        minima: "",
        maxima: "",
        texto_clima: "",
        icone_clima: "",
    };

    function preencherClimaAgora(cidade, estado, pais, temperatura, minima, maxima, texto_clima, icone_clima) {

        var texto_local = `${cidade}, ${estado}. ${pais}`;

        $("#texto_local").text(texto_local);
        $("#texto_clima").text(texto_clima);
        $("#texto_temperatura").html(String(`${temperatura}°`));    
        $("#icone_clima").css("background-image", `url('${weatherObject.icone_clima}')`);
    }

    function gerarGrafico(horas, temperaturas) {
        Highcharts.chart('hourly_chart', {
            chart: {
                type: 'line',
            },
            title: {
                text: 'Temperatura Hora a Hora',
            },
            xAxis: {
                categories: horas
            },
            yAxis: {
                title: {
                    text: 'Temperatura (°C)',
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true,
                    },
                    enableMouseTracking: false,
                }
            },
            series: [{
                showInLegend: false,
                data: temperaturas,
            }]
        });
    }

    function pegarPrevisaoHoraAHora(localCode) {
        $.ajax({
            url: `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${localCode}?apikey=${accuweatherAPIKey}&language=pt-br&metric=true`,
            type: "GET",
            dataType: "json",
            success: function(data) {
                var horarios = [];
                var temperaturas = [];

                for (let i = 0; i < data.length; i++) {
                    var hora = new Date(data[i].DateTime).getHours();

                    horarios.push(String(`${hora}h`));
                    temperaturas.push(data[i].Temperature.Value);

                    gerarGrafico(horarios, temperaturas);
                    $(".refresh-loader").fadeOut();
                }
            }, 
            error: function(data) {
                console.log("Errooooou! pegarPrevisaoHoraAHora");
                gerarErro("Erro ao obter a previsão hora a hora.");
            }, 
        });
    }

    function preencherPrevisao5Dias(previsoes) {
        $("#info_5dias").html("");

        var diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

        for(var i = 0 ; i < previsoes.length ; i++) {

            var dataHoje = new Date(previsoes[i].Date);
            var dia_semana = diasSemana[dataHoje.getDay()];
            var iconNumber = previsoes[i].Day.Icon <= 9 ? "0" + String(previsoes[i].Day.Icon) : String(previsoes[i].Day.Icon);        
            var minima = previsoes[i].Temperature.Minimum.Value;
            var maxima = previsoes[i].Temperature.Maximum.Value;

            iconeClima = `https://developer.accuweather.com/sites/default/files/${iconNumber}-s.png`;

            elementoHTMLDia =  "<div class='day col'>";
            elementoHTMLDia += "<div class='day_inner'>";
            elementoHTMLDia += `<div class='dayname'>${dia_semana}</div>`;
            elementoHTMLDia += `<style='background-image: url('${iconeClima}')' class='daily_weather_icon'></div>`;
            elementoHTMLDia += `<div class='max_min_temp'>${minima}° / ${maxima}°</div>`;
            elementoHTMLDia += "</div>";
            elementoHTMLDia += "</div>";

            $("#info_5dias").append(elementoHTMLDia);

            elementoHTMLDia = "";

        }
    }

    function pegarPrevisao5Dias(localCode) {
        $.ajax({
            url: `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${localCode}?apikey=${accuweatherAPIKey}&language=pt-br&metric=true`,
            type: "GET",
            dataType: "json",
            success: function(data) {
                var minima = data.DailyForecasts[0].Temperature.Minimum.Value;
                var maxima = data.DailyForecasts[0].Temperature.Maximum.Value;

                $("#texto_max_min").html(String(`${minima}° / ${maxima}°`));

                preencherPrevisao5Dias(data.DailyForecasts);
            }, 
            error: function(data) {
                console.log("Errooooou! pegarPrevisao5Dias");
                gerarErro("Erro ao obter a previsão de 5 dias.");
            }, 
        });
    }

    function pegarTempoAtual(localCode) {
        $.ajax({
            url: `http://dataservice.accuweather.com/currentconditions/v1/${localCode}?apikey=${accuweatherAPIKey}&language=pt-br`,
            type: "GET",
            dataType: "json",
            success: function(data) {
                var iconNumber = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : String(data[0].WeatherIcon);
                
                weatherObject.temperatura = data[0].Temperature.Metric.Value;
                weatherObject.texto_clima = data[0].WeatherText;
                weatherObject.icone_clima = `https://developer.accuweather.com/sites/default/files/${iconNumber}-s.png`;

                preencherClimaAgora();
            }, 
            error: function(data) {
                console.log("Errooooou! pegarTempoAtual");
                gerarErro("Erro em obter o clica atual.");
            }, 
        });
    }

    function pegarLocalUsuario(lat, long) {
        $.ajax({
            url: `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${accuweatherAPIKey}&q=${lat}%2C${long}&language=pt-br`,
            type: "GET",
            dataType: "json",
            success: function(data) {

                try {
                    weatherObject.cidade = data.ParentCity.LocalizedName;                
                } catch {
                    weatherObject.cidade = data.LocalizedName;
                }

                weatherObject.estado = data.AdministrativeArea.LocalizedName;
                weatherObject.pais = data.Country.LocalizedName;
                
                var localCode = data.Key;
                
                pegarTempoAtual(localCode);
                pegarPrevisao5Dias(localCode);
                pegarPrevisaoHoraAHora(localCode);
        
            }, 
            error: function(data) {
                console.log("Errooooou! pegarLocalUsuario");
                gerarErro("Erro no código do local");
            }, 
        });
    }

    function pegarCoordenadasDaPesquisa(input) {

        input = encodeURI(input);

        $.ajax({
            url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?access_token=${mapboxToken}`,
            type: "GET",
            dataType: "json",
            success: function(data) {

                try {
                    var lat = data.features[0].geometry.coordinates[1];
                    var long = data.features[0].geometry.coordinates[0];
        
                    pegarLocalUsuario(lat, long);                
                } catch {
                    gerarErro("Erro na pesquisa de local");
                }

            }, 
            error: function(data) {
                console.log("Errooooou! pegarCoordenadasDaPesquisa");
                gerarErro("Erro na pesquisa de local");
            }, 
        });
    }

    function pegarCoordenadasDoIP() {
        
        // Rio de Janeiro
        var lat_padrao = -22.981361;
        var long_padrao = -43.223176;

        $.ajax({
            url: `http://geoplugin.net/json.gp`,
            type: "GET",
            dataType: "json",
            success: function(data) {
                if (data.geoplugin_latitude && data.geoplugin_longitude) {
                    pegarLocalUsuario(data.geoplugin_latitude, data.geoplugin_longitude); 
                } else {
                    pegarLocalUsuario(lat_padrao, long_padrao); 
                }
            }, 
            error: function(data) {
                console.log("Errooooou! pegarCoordenadasDoIP()");
                pegarLocalUsuario(lat_padrao, long_padrao);     
            }, 
        });
    }

    function gerarErro() {
        if(!mensagem) {
            mensagem = "Erro na solicitação";
        }

        $('.refresh-loader').hide();
        $('#aviso-erro').text(mensagem);
        $('#aviso-erro').slideDown();

        window.setTimeout(function() {
            $('#aviso-erro').slideUp()
        }, 5000);
    }

    // gerarErro();

    pegarCoordenadasDoIP();

    $("#search-button").click(function() {

        $(".refresh-loader").show();

        var local = $("input#local").val();
        if (local) {
            pegarCoordenadasDaPesquisa(local);
        } else {
            alert("Local inválido.");
        }
    });

    $("input#local").on('keypress', function(e) {
        
        if (e.which == 13) {
            
            $(".refresh-loader").show();
            
            var local = $("input#local").val();
            if (local) {
                pegarCoordenadasDaPesquisa(local);
            } else {
                alert("Local inválido.");
            }        
        }
    });

});