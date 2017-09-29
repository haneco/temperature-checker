# ダイキンエアコン監視プログラム

## 概要

ダイキン製エアコンの室温センサーを読み取り、設定した室温の範囲外の場合は自動で冷暖房をオンするプログラムです。
また、上記範囲内で一定時間同じ室温が続いた場合は、自動でオフします。

AN80TRP-WとBRP072A41の組み合わせで動作確認していますが、何か問題が起きても責任は取れませんのでご利用の際は自己責任でお願いします。

## 設定

デフォルト値がconfig/default.jsonに設定されています。
そのままでは動作しないので、config/local.jsonを作成し、値を上書きしてください。

```
{
    // 動作変更時の通知メールを送るための設定。nodemailerの設定を参考にしてください。
    "mailSettings": {
        "smtp": {
            "host": "smtp.example.com",
            "port": 587,
            "secure": false,
            "auth": {
                "user": "user",
                "pass": "password"
            }
        },
        "from": "エアコン通知 <notify@example.com>", // メール送信元
        "to": "recipient@example.com"                // メール送信先
    },
    "targetTemperature": {
        "cooling": "25.0", // 冷房の設定温度
        "heating": "20.0"  // 暖房の設定温度
    },
    "temperatureThreshold": {
        "high": 28.0, // この室温を超えると冷房開始
        "low": 18.0   // この室温を下回ると暖房開始
    },
    "watchSettings": {
        "interval": 600000, // 室温のチェック間隔（ミリ秒）
        "stablizedInterval": 3600000 // 同じ室温が続いた場合に運転を停止する時間（ミリ秒）
    },
    "host": "192.168.11.2" // エアコンアダプタのIPアドレス
}```
