var fs = require('fs');
var path = require('path');

var d3 = require('d3');

var $plotlist = document.getElementById('plot-list');
var $toggles = document.getElementById('plot-toggles');
var $images = document.getElementById('plot-images');
var $mock = document.getElementById('plot-mock');
var $toggleBaseline = document.createElement('button');
var $toggleTest = document.createElement('button');
var $toggleDiff = document.createElement('button');
var $imgBaseline = document.createElement('img');
var $imgTest = document.createElement('img');
var $imgDiff = document.createElement('img');

$toggles.style.display = 'none';
$images.style.display = 'none';

setupToggle($toggleBaseline, $imgBaseline, 'Baseline');
setupToggle($toggleTest, $imgTest, 'Test');
setupToggle($toggleDiff, $imgDiff, 'Diff');

var pathToRoot = path.join(__dirname, '../../');
var pathToImageTest = path.join(pathToRoot, 'test/image');
var pathToBuild = path.join(pathToRoot, 'build/');
var dirMocks = path.join(pathToImageTest, 'mocks/');
var dirBaseline = path.join(pathToImageTest, 'baselines/');
var dirTest = path.join(pathToBuild, 'test_images/');
var dirDiff = path.join(pathToBuild, 'test_images_diff/');

// N.B. brfs only understand hard-coded paths
var imageNames = fs.readFileSync(
       __dirname + '/../../build/list_of_incorrect_images.txt',
        'utf8'
    )
    .split('\n')
    .filter(function(x) { return x; })
    .map(function(x) {
        return x.split('diff-')[1].split('.png')[0];
    });

imageNames.forEach(function(imageName) {
    $plotlist.appendChild(createButton(imageName));
});

function createButton(imageName) {
    var button = document.createElement('button');
    button.style.cssFloat = 'left';
    button.style.height = '40px';
    button.innerHTML = imageName;
    button.style.padding = '0.5em';
    button.style.border = '0';
    button.style.margin = '1px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', function() {
        d3.json(dirMocks + imageName + '.json', function(err, mock) {
            $toggles.style.display = 'block';

            $images.style.display = 'block';
            $imgBaseline.src = dirBaseline + imageName + '.png';
            $imgTest.src = dirTest + imageName + '.png';
            $imgDiff.src = dirDiff + 'diff-' + imageName + '.png';

            $mock.innerHTML = JSON.stringify(mock, null, 2);
        });
    });

    return button;
}

function setupToggle(toggle, img, title) {
    img.title = title;
    toggle.innerHTML = title;
    toggle.style.padding = '0.5em';
    toggle.style.border = '0';
    toggle.style.margin = '1px';
    toggle.style.cursor = 'pointer';

    checkToggle(toggle, img);

    toggle.addEventListener('click', function() {
        if(toggle.value === 'checked') uncheckToggle(toggle, img);
        else checkToggle(toggle, img);
    });

    $toggles.appendChild(toggle);
    $images.appendChild(img);
}

function checkToggle(toggle, img) {
    toggle.value = 'checked';
    toggle.style.color = '#4c4c4c';
    toggle.style.backgroundColor = '#f2f1f0';
    img.style.display = 'inline';
}

function uncheckToggle(toggle, img) {
    toggle.value = 'unchecked';
    toggle.style.color = '#f2f1f0';
    toggle.style.backgroundColor = '#4c4c4c';
    img.style.display = 'none';
}
