import { writeFileSync } from 'fs';

async function go() {
    let out = '';
    try {
        // 1. Fetch Store API for Rolex Variation 473
        const r1 = await fetch('http://localhost:5088/wp-json/wc/store/v1/products/473');
        const varProd = await r1.json();
        out += '--- Store API Var 473 ---\n';
        out += 'Extensions: ' + JSON.stringify(varProd.extensions, null, 2) + '\n';
        out += 'Full JSON keys containing swatch: \n';

        // Deep search for anything related to 'swatch'
        const fullStr = JSON.stringify(varProd);
        if (fullStr.includes('swatch')) {
            out += fullStr.substring(fullStr.indexOf('swatch') - 50, fullStr.indexOf('swatch') + 200) + '\n';
        } else {
            out += 'No "swatch" string found in Store API response.\n';
        }

        out += '\n--- Solution Strategy ---\n';
        out += 'Since Store API lacks custom meta, and V3 API returns 401, the most robust way in the app ';
        out += 'is to fetch the product HTML, regex the data-product_variations JSON, and map swatch_image_url ';
        out += 'to the variation ID.\n';

        writeFileSync('swatch_strategy.txt', out);
        console.log('Done! Check swatch_strategy.txt');
    } catch (e) {
        writeFileSync('swatch_strategy.txt', 'ERROR: ' + e.message);
        console.error(e);
    }
}

go();
