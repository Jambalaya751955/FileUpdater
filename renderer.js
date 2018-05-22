let ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('info', function(event, data) {
    console.log(data);
    let html = '';
    for (let i = 0; i < data.length; i++) {
        html += createCard(data[i]);
        console.log(data[i]);
    }
    
    document.getElementById("root").innerHTML = html;
    
    if (html == createCard('ダウンロード成功! (≧▽≦) お疲れ様！')) {
        document.getElementById("root").innerHTML = createCard('更新されたファイルはないよ！ また今度実行してね (^O^)／');
    }
});

let createCard = (text) => {
    return `<div class="card card-1"><div style="padding-top: 15px;">` + text + `</div></div>`;
}