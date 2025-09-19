const fs = require('fs')


// We accidentally used the bin numbers for distance measurement
// instead of LAB space. Since LAB bins are a uniform 10x10x10 in 
// LAB space, we can fix the distance by just multiplying all 
// distances by 10


trLosses = JSON.parse(fs.readFileSync("../translation_loss_old_error.json"));
trLosses.forEach(l => {
    l.dist = l.dist * 10;
  });
fs.writeFileSync("../translation_loss_old_fixed.json", JSON.stringify(trLosses, null, 2));


