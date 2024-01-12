import numpy
import base64

plotlyjsShortTypes = {
    'int8': 'i1',
    'uint8': 'u1',
    'int16': 'i2',
    'uint16': 'u2',
    'int32': 'i4',
    'uint32': 'u4',
    'float32': 'f4',
    'float64': 'f8'
}

int8bounds = numpy.iinfo(numpy.int8)
int16bounds = numpy.iinfo(numpy.int16)
int32bounds = numpy.iinfo(numpy.int32)
uint8bounds = numpy.iinfo(numpy.uint8)
uint16bounds = numpy.iinfo(numpy.uint16)
uint32bounds = numpy.iinfo(numpy.uint32)

skipKeys = [
    'geojson',
    'layers',
    'range'
]

def arraysToB64(obj, newObj) :
    for key, val in obj.items() :
        if key in skipKeys :
            newObj[key] = val
        elif isinstance(val, dict) :
            newObj[key] = dict()
            arraysToB64(val, newObj[key])
        elif isinstance(val, list) :
            try :
                arr = numpy.array(val)
            except Exception :
                newObj[key] = val
                continue

            if arr.dtype == 'object' :
                newList = list()
                for v in val :
                    if isinstance(v, dict) :
                        newList.append(arraysToB64(v, dict()))
                    else :
                        newList.append(v)

                newObj[key] = newList
            else :
                # In a real application one does not need to convert
                # small arrays like those that only have 2 items.
                # But here we convert 2 item array to test typed arrays
                # in more places.

                # skip converting arrays with no items
                if(arr.ndim == 1 and arr.shape[0] < 1) :
                    newObj[key] = val
                    continue

                # convert default Big Ints until we could support them in plotly.js
                if str(arr.dtype) == 'int64' :
                    max = arr.max()
                    min = arr.min()
                    if max <= int8bounds.max and min >= int8bounds.min :
                        arr = arr.astype(numpy.int8)
                    elif max <= int16bounds.max and min >= int16bounds.min :
                        arr = arr.astype(numpy.int16)
                    elif max <= int32bounds.max and min >= int32bounds.min :
                        arr = arr.astype(numpy.int32)
                    else :
                        newObj[key] = val
                        continue

                elif str(arr.dtype) == 'uint64' :
                    if max <= uint8bounds.max and min >= uint8bounds.min :
                        arr = arr.astype(numpy.uint8)
                    elif max <= uint16bounds.max and min >= uint16bounds.min :
                        arr = arr.astype(numpy.uint16)
                    elif max <= uint32bounds.max and min >= uint32bounds.min :
                        arr = arr.astype(numpy.uint32)
                    else :
                        newObj[key] = val
                        continue

                if str(arr.dtype) in plotlyjsShortTypes :
                    newObj[key] = {
                        'dtype': plotlyjsShortTypes[str(arr.dtype)],
                        'bdata': base64.b64encode(arr).decode('ascii')
                    }

                    if(arr.ndim > 1) :
                        newObj[key]['shape'] = str(arr.shape)[1:-1]

                    #print(val)
                    #print(newObj[key])
                    #print('____________________')
                else :
                    newObj[key] = val

        else :
            newObj[key] = val

    return newObj
