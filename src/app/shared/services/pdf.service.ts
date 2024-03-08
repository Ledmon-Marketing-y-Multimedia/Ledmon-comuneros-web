import { Injectable } from '@angular/core';
import { ShadingPattern } from 'jspdf';

import { jsPDF } from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfService {


  constructor() { }



  async print(printData: any){
    printData = Object.assign(printData, {});
    const doc: any = new jsPDF();
    doc.vars = {};
    doc.vars.fontFamily = 'WorkSans';
    doc.vars.fontWeightBold = 'bold';
    doc.vars.fontWeightNormal = 'normal';

    for (const element of printData.comuneros) {

      await new Promise<void>((resolve) => {
        doc.setFontSize(12);
        doc.text(element.user.name.trim(), 200, 40, null, null, "right");
        doc.text(element.lugar.address, 200, 50, null, null, "right");
        doc.text(element.lugar.cp + " " + element.lugar.poblacion, 200, 60, null, null, "right");
        doc.text(element.lugar.provincia || "", 200, 70, null, null, "right");
        doc.html(printData.content, {
          callback: function () {
            if(printData.comuneros.indexOf(element) < printData.comuneros.length - 1){
                doc.addPage();
            }
            else doc.output('dataurlnewwindow');
            resolve();
            return doc;
          },
          x: 10,
          y: 100,
          width: 500,
          windowWidth: 500,
          autoPaging: false
        });
      });
    }
  }

}
