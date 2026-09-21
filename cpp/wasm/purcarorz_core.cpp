// Portable PURCAR ORZ application state. This module is compiled to WebAssembly.
// Camera pixels and YOLO12n inference are browser responsibilities; this preserves
// the C++ menu behavior: filtering, confidence thresholding, journaling statistics.
#include <algorithm>
#include <cstring>
#include <string>
#include <vector>

struct Detectie {
    std::string obiect;
    double incredere;
    int x, y;
    Detectie(const char* nume, double scor, int coordX, int coordY)
        : obiect(nume ? nume : ""), incredere(scor), x(coordX), y(coordY) {}
};

struct JurnalDetectii {
    std::vector<Detectie> date;
    double prag;
    std::string filtru;
    JurnalDetectii() : prag(.50), filtru("all") {}
    bool accepta(const char* obiect, double incredere) const {
        return incredere >= prag && (filtru == "all" || filtru == obiect);
    }
    void salveaza(const char* obiect, double incredere, int x, int y) {
        if (accepta(obiect, incredere)) date.push_back(Detectie(obiect, incredere, x, y));
    }
    double medie() const {
        if (date.empty()) return 0;
        double suma = 0; for (size_t i=0;i<date.size();++i) suma += date[i].incredere;
        return suma / date.size();
    }
};

extern "C" {
JurnalDetectii* po_create() { return new JurnalDetectii(); }
void po_destroy(JurnalDetectii* jurnal) { delete jurnal; }
void po_set_threshold(JurnalDetectii* jurnal, double prag) { if (jurnal) jurnal->prag = std::max(.05, std::min(.95, prag)); }
void po_set_filter(JurnalDetectii* jurnal, const char* obiect) { if (jurnal) jurnal->filtru = (obiect && *obiect) ? obiect : "all"; }
int po_record(JurnalDetectii* jurnal, const char* obiect, double incredere, int x, int y) { if (!jurnal || !jurnal->accepta(obiect, incredere)) return 0; jurnal->salveaza(obiect, incredere, x, y); return 1; }
int po_count(JurnalDetectii* jurnal) { return jurnal ? (int)jurnal->date.size() : 0; }
double po_average(JurnalDetectii* jurnal) { return jurnal ? jurnal->medie() : 0; }
}
