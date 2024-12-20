const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const FileCheck = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log('Something went wrong... Try again.');
    process.exit();
  }
}

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Text watermark added successfully!');
    startApp();
  } catch (error) {
    console.log('Something went wrong... Try again.');
  }
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('Image watermark added successfully!');
    startApp();
  } catch (error) {
    console.log('Something went wrong... Try again.');
  }
};

const prepareOutputFilename = (filename) => {
  const [ name, ext ] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};

const editImage = async (inputFile) => {
  const editOptions = await inquirer.prompt([
    {
      name: 'editChoice',
      type: 'list',
      message: 'Do you want to edit the image before adding the watermark?',
      choices: ['No', 'Make image brighter', 'Increase contrast', 'Make image B&W', 'Invert image'],
    },
  ]);

  if (editOptions.editChoice === 'No') {
    return;
  }

  try {
    const image = await Jimp.read(inputFile);

    switch (editOptions.editChoice) {
      case 'Make image brighter':
        image.brightness(0.2); 
        break;
      case 'Increase contrast':
        image.contrast(0.5);
        break;
      case 'Make image B&W':
        image.greyscale();
        break;
      case 'Invert image':
        image.invert();
        break;
    }

    await image.writeAsync(inputFile);
    console.log('Image edited successfully!');
  } catch (error) {
    console.log('Something went wrong while editing the image... Try again.');
    process.exit();
  }
};

const startApp = async () => {
  const answer = await inquirer.prompt([
    {
      name: 'start',
      message:
        "Hi! Welcome to 'Watermark manager'. Copy your image files to `/img` folder. Then you'll be able to use them in the app. Are you ready?",
      type: 'confirm',
    },
  ]);

  if (!answer.start) process.exit();

  const options = await inquirer.prompt([
    {
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    },
    {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    },
  ]);

  const inputFilePath = './img/' + options.inputImage;
  FileCheck(inputFilePath);

  await editImage(inputFilePath);

  if (options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([
      {
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
      },
    ]);
    options.watermarkText = text.value;

    addTextWatermarkToImage(
      inputFilePath,
      './img/' + prepareOutputFilename(options.inputImage),
      options.watermarkText
    );
  } else {
    const image = await inquirer.prompt([
      {
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      },
    ]);
    options.watermarkImage = image.filename;

    const watermarkFilePath = './img/' + options.watermarkImage;
    FileCheck(watermarkFilePath);

    addImageWatermarkToImage(
      inputFilePath,
      './img/' + prepareOutputFilename(options.inputImage),
      watermarkFilePath
    );
  }
};

startApp();