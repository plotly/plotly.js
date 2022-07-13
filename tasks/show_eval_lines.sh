#! /bin/bash
err=0
src=""
while IFS= read -r str
do
    if [[ "$str" == *"plotly.js/dist"* ]]; then
        src="$str"
    fi

    if [[ "$str" == *"error  The Function constructor is eval  no-new-func"* ]]; then
        str=${str%error*}
        col=${str#*:}
        row=${str%:*}
        pre=$((row-10))
        err=$((err+1))
        echo "________________________________________________________________________________"
        sed -n "${pre},${row}p" "$src"

        for ((i = 0 ; i <= col + 10 ; i++)); do
            echo -n "^"
        done
        echo

        echo "Count: $err | Line: $row"
    fi
done
