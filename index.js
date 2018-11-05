const fs = require('fs');
const path = require('path');
const del = require('del');
const URL = require('url').URL;

const createdFolders = {};
const filesUrls = [];

const promisify = (func, path) => {
  return new Promise(async (resolve, reject) => {
      func(path, async (err, data) => {
        if(err) {
          reject(err);
        }
        resolve(data);
      });
    });
}

const parseSnippets = () => {
  const snippetsDirPath = './snippets';

  // check snipets folder
  const dirStats = fs.lstat(snippetsDirPath, async (err, data) => {
    if(err) {
      console.log(`\nError while get stat for ${snippetsDirPath}`);
      throw err;
    }

    const snippetsDirPromise = promisify(fs.readdir, snippetsDirPath);

    const articlesDirs = await snippetsDirPromise
      .then(result => {
        return result;
      })
      .catch(err => {
        console.log('Error in snippetsDirPromise:');
        console.log(err);
      });

    // console.log(articlesDirs);


    const articleDirsPromises = articlesDirs.map(async (dir) => {
      const resultPromise = createArticleDirPromise({snippetsDirPath, dir});
      return resultPromise;
    });

    console.log('articleDirsPromises', articleDirsPromises);
    // c

    // return;

    await Promise.all(articleDirsPromises)
      .then(result => {
        console.log('\n\n 3 -- articleDirsPromises result:');
        console.log(result);

        return fillIndex(result);
      })
      .then(fillIndexResult => {
        console.log('fillIndexResult', fillIndexResult);
      })
      .catch(err => {
        console.log(err);
      });

    // console.log(demoDirsPromises);

    console.log('\n5 All files was written');
    console.log(filesUrls);
  });
};

// ------------------------------

const fillIndex = dirs => {
  const indexSrcPath = 'index-src.html';
  const indexReadyPath = 'index.html';

  const listMarkup = dirs.map(item => {
    if(!item.files) {
      return '';
    }

    let filesItems = item.files.map(file => {
      return `<li><a href="${file}">${file}</a></li>`;
    });
    const content = `
    <dt>${item.dir}</dt>
    <dd>
      <ul>
        ${filesItems.join('\n')}
      </ul>
    </dd>
    `;

    return content;
  });

  const pageContent = `<dl>${listMarkup.join('\n')}</dl>`;

  return new Promise((resolve, reject) => {
    fs.readFile(indexSrcPath, 'utf-8', async (err, htmlData) => {
      if(err) {
        console.log(`\nError while read HTML ${indexSrcPath}`);
        reject(err);
      }

      const pageWithContent = htmlData.replace('<!-- content -->', pageContent);

      await fs.writeFile(indexReadyPath, pageWithContent, (err) => {
        if(err) {
          console.log(`\nError while writeFile ${indexReadyPath}`);
          reject(err);
        }

        resolve(indexReadyPath);
      });
    });
  });
}

// ------------------------------

const createArticleDirPromise = async ({snippetsDirPath, dir}) => {
  const articleDirPath = `${snippetsDirPath}/${dir}`;
  const demoFolderPath = `snippetsReady/${dir}`;
  const delResult = await delFolder(demoFolderPath);
  const readyFolderPath = await createFolder(demoFolderPath);

  return new Promise((resolve, reject) => {
    fs.readdir(articleDirPath, async (err, files) => {
      if(err) {
        console.log(`\nError while read ${articleDirPath}`);
        reject(err);
      }

      if(files.length === 0) {
        resolve({});
      }

      const articleDirPromise = await handleFiles({
        files,
        articleDirPath,
        readyFolderPath
      });

      Promise.all(articleDirPromise)
        .then(files => {
          resolve({dir, files});
        })
        .catch(err => {
          reject(err);
        });
    })
  });
};

// ------------------------------

const getFilesByType = (files) => {
  const filesByType = files.reduce((prev, item) => {
    const extname = path.extname(item).slice(1);
    const pathname = item.split('.')[0];

    if(!prev[extname]) {
      prev[extname] = {};
    }

    prev[extname][pathname] = item;

    return prev;
  }, {});

  return filesByType;
}

// ------------------------------

const handleFiles = async ({files, articleDirPath, readyFolderPath}) => {
  if(files.length === 0) {
    return;
  }

  const filesByType = getFilesByType(files);
  const htmlKeys = Object.keys(filesByType.html);

  const filesPromises = htmlKeys.map(async (item) => {
    const newPromise = new Promise((resolve, reject) => {
      const htmlPath = filesByType.html[item];
      const cssPath = filesByType.css[item];
      const cssFullPath = `${articleDirPath}/${cssPath}`;

      fs.readFile(cssFullPath, 'utf-8', (err, cssData) => {
        if(err) {
          console.log(`\nError while read CSS ${cssFullPath}`);
          reject(err);
        }

        cssData = cssData.replace(/\u200B/g, '\n');

        const WriteFilePromise = createWriteFilePromise({
          articleDirPath,
          readyFolderPath,
          htmlPath,
          cssData
        });

        WriteFilePromise
          .then(resultPath => {
            resolve(resultPath);
          })
          .catch(err => {
            reject(err);
          });
      }); // End cssContent
    });

    return newPromise;
  }); // End map

  // console.log('filesPromises', filesPromises);

  return filesPromises;
};

// ------------------------------

const createWriteFilePromise = ({
    articleDirPath,
    readyFolderPath,
    htmlPath,
    cssData
  }) => {
  const htmlFullPath = `${articleDirPath}/${htmlPath}`;
  const readyHtmlPath = `${readyFolderPath}/${htmlPath}`;
  const headWithCSS = `
    <script src="../../assets/demo.js"></script>
    <link rel="stylesheet" href="../../assets/demo.css" />
    <style id="demo-css">\n${cssData}\n</style>
  </head>`;

  return new Promise((resolve, reject) => {
    fs.readFile(htmlFullPath, 'utf-8', async (err, htmlData) => {
      if(err) {
        console.log(`\nError while read HTML ${htmlFullPath}`);
        reject(err);
      }

      // return data;
      const htmlWithCSS = htmlData.replace('</head>', headWithCSS);

      await fs.writeFile(readyHtmlPath, htmlWithCSS, (err) => {
        if(err) {
          console.log(`\nError while writeFile`);
          reject(err);
        }

        resolve(readyHtmlPath);
      });
    });
  });
}

// ------------------------------

const delFolder = (path) => {
  return del(path)
    .then(path => {
      return true;
    })
    .catch(err => {
      return false;
    });
};

// ------------------------------

const createFolder = async (path) => {
  if(createdFolders[path]) {
    return path;
  }

  const promise = new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      };

      createdFolders[path] = path;
      resolve(path);
    })
  });

  const result = await promise
    .then(path => {
      return path;
    })
    .catch(err => {
      console.log('Err while creating folder', err);
    });

  return result;
};

// ------------------------------

parseSnippets();

// console.log('hello');
