const params = new URLSearchParams(window.location.search);

document.getElementById("series").innerHTML = params.get("series");
document.getElementById("puzzle").innerHTML = params.get("puzzle");
document.getElementById("tier").innerHTML = params.get("tier");
document.getElementById("type").innerHTML = params.get("type");
document.getElementById("color1").innerHTML = params.get("color1");
document.getElementById("color2").innerHTML = params.get("color2");
document.getElementById("variant").innerHTML = params.get("variant");
document.getElementById("condition").innerHTML = params.get("condition");
document.getElementById("edition").innerHTML = params.get("edition");
