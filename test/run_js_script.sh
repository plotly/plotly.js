# wraps a JS in a simple webpage and runs it in a browser

[ -z "$1" ] && (echo "Provide path to script as argument" && exit -1)
[ -z "$BROWSER_BIN" ] && BROWSER_BIN=firefox
# delay time in seconds before launching browser
[ -z "$D" ] && D=10

stripped_script="$(basename ${1%.*})"

html_out="/tmp/$stripped_script.html"

cat > "$html_out" <<HEREDOC
<!DOCTYPE html>
<html>
<head>
<meta http-equiv='Content-Type' content='text/html:charset=utf-8' />
</head>
<body>
<script src="$stripped_script-min.js"></script>
</body>
</html>
HEREDOC

node_modules/.bin/watchify "$1" -o "/tmp/$stripped_script-min.js" -v -d&
watchify_proc=$!

_kill_bg_and_exit () {
    kill -9 "$watchify_proc" && exit 0
}

sleep "$D"

echo "Opening browser at URL:"
echo "$html_out"
$BROWSER_BIN "$html_out"

trap _kill_bg_and_exit SIGINT

while [ 1 ]; do sleep 1; done
