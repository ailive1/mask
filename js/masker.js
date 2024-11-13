var maskImage = null;
var canvasHeight, canvasWidth;
var imgHeight, imgWidth;
var mask = null;
var canvas = new fabric.Canvas("canvas", {
  isDrawingMode: true,
  enableRetinaScaling: false,
  preserveObjectStacking: true,
});

var uploadArea = document.getElementById("uploader");
uploadArea.ondragover = function (e) {
  e.preventDefault();
};
uploadArea.ondrop = function (e) {
  e.preventDefault();
  uploadDragnDrop(e.dataTransfer.files[0]);
};

 var slider = document.getElementById('brushSize');

  noUiSlider.create(slider, {
    start: 30,
	step: 5,
    range: {
      'min': 10,
      'max': 100
    },
	pips: { 
        mode: 'steps',
        density: 5
    }
  });

  slider.noUiSlider.on('update', function (values, handle) {
	canvas.freeDrawingBrush.width = parseInt(values[handle]);
  });

canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
canvas.freeDrawingBrush.width = slider.noUiSlider.get();
canvas.freeDrawingBrush.color = hexToRgb('#000000');
fabric.textureSize = 4096;

$("html").on("paste", function (event) {
	if (event.originalEvent.clipboardData) {
	  var items = event.originalEvent.clipboardData.items;
	  if (items) {
		for (index in items) {
		  var item = items[index];
		  if (item.kind === "file") {
			var blob = item.getAsFile();
			var source = URL.createObjectURL(blob);
			loadSourceImage(source, false);
			return;
		  }
		}
	  }
	}
});

function uploadImage(e) {
  var filetype = e.target.files[0].type;
  url = URL.createObjectURL(e.target.files[0]);
  if (filetype == "image/png" || filetype == "image/jpeg") {
    loadSourceImage(url, false);
  }
}

function uploadDragnDrop(file) {
  var url = URL.createObjectURL(file);
  loadSourceImage(url, false);
  //it doesn't check, if the file is an image,
  //but I'll just assume they know they are uploading an image...
}

function loadSourceImage(baseUrl, externalImage) {
  var resizeFactor = 1;
  var minWidth = 300; 
  var minHeight = 300; 
  var margin = 50; 

  sourceImageUrl = baseUrl;
  fabric.Image.fromURL(sourceImageUrl, function (img) {
    imgHeight = img.height * resizeFactor;
    imgWidth = img.width * resizeFactor;

    var windowWidth = window.innerWidth - 2 * margin;
    var windowHeight = window.innerHeight - 2 * margin;

    var canvasWidth, canvasHeight;

    if (img.height > img.width) {
      canvasHeight = Math.max(minHeight, windowHeight);
      canvasWidth = (img.width * canvasHeight) / img.height;
    } else {
      canvasWidth = Math.max(minWidth, windowWidth);
      canvasHeight = (img.height * canvasWidth) / img.width;
    }

    // 确保画布尺寸不超过窗口尺寸
    if (canvasWidth > windowWidth) {
      canvasWidth = windowWidth;
      canvasHeight = (img.height * canvasWidth) / img.width;
    }
    if (canvasHeight > windowHeight) {
      canvasHeight = windowHeight;
      canvasWidth = (img.width * canvasHeight) / img.height;
    }

    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);

    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
      scaleX: canvas.width / img.width,
      scaleY: canvas.height / img.height,
      erasable: false,
    });

    canvasHeight = canvas.getHeight();
    canvasWidth = canvas.getWidth();
  });

  document.getElementById("uploader").style.display = "none";
   // Show the tools after the image is loaded
  document.getElementById("toolsDiv").style.display = "block";

  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    document.getElementById("container").style.display = "block";
  } else {
    document.getElementById("container").style.display = "grid";
  }
  brush();
}




function undo() {
  if (canvas._objects.length > 0) {
    canvas._objects.pop();
    canvas.renderAll();
  }
}

//*****************Keyboard shortcuts *********************/

//undo on CTRL+Z
$(document).on("keydown", function (e) {
  if (e.ctrlKey && e.which === 90) {
    undo();
  }
});

var opac = 1;
//Rotate masks with left and right arrows
//Set opacity of selected object (masks or lines) with up and down arrows
//Clone object with ALT
//Press "Insert" to choose a custom subreddit

$(document).on("keydown", function (e) {
  var target = $(e.target);
  //bind delete object to DEL key
  if (e.which === 46) {
    deleteObject();
  }
});

//function to convert hex color to rgb
function hexToRgb(hex) {
  var opacity = 0.7;//document.getElementById("brushOpacity").value / 100;
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var output =
    "rgba(" +
    parseInt(result[1], 16) +
    "," +
    parseInt(result[2], 16) +
    "," +
    parseInt(result[3], 16) +
    "," +
    opacity +
    ")";
  return output;
}

//function to use the eraser
function eraser() {
  canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
  canvas.isDrawingMode = true;
  var brushSize = slider.noUiSlider.get();
  canvas.freeDrawingBrush.width = parseInt(brushSize);
  canvas.renderAll();
}
//function to use the brush
function brush() {
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.isDrawingMode = true;
  var brushSize = slider.noUiSlider.get();
  canvas.freeDrawingBrush.width = parseInt(brushSize);
  canvas.freeDrawingBrush.color = hexToRgb(
    '#000000'
  );
  canvas.renderAll();
}

//function to disable drawing mode
function disableDrawingMode() {
  canvas.isDrawingMode = false;
  canvas.renderAll();
}


//function to duplicate the mask
function duplicateMask() {
  if (canvas.getActiveObject()) {
    var obj = canvas.getActiveObject();
  } else {
    var obj = canvas._objects[canvas._objects.length - 1];
  }
  var object = fabric.util.object.clone(obj);
  object.set("top", object.top + 7);
  object.set("left", object.left + 7);
  canvas.add(object);
  canvas.isDrawingMode = false;
  canvas.renderAll();
}

//function to delete the selected object
function deleteObject() {
  canvas.remove(canvas.getActiveObject());
  canvas.isDrawingMode = false;
  canvas.renderAll();
}

function downloadMask() {
  var hasMask = false;

  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  var tempContext = tempCanvas.getContext('2d');

  tempContext.fillStyle = 'rgba(0, 0, 0, 0)';
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  canvas.forEachObject(function(obj) {
    if (!obj.excludeFromExport) { 
      hasMask = true;
      obj.clone(function(clonedObj) {
        clonedObj.render(tempContext);
      });
    }
  });

  if (!hasMask) {
    alert('没有蒙版，请先用笔刷创建蒙版。');
    return;
  }

  tempCanvas.toBlob(function(blob) {
    saveAs(blob, 'mask.png');
  });
}


