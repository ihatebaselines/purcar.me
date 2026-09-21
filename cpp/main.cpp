#if __has_include(<opencv2/dnn.hpp>)
#define ARE_OPENCV 1
#include <opencv2/dnn.hpp>
#include <opencv2/highgui.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/imgproc.hpp>
#include <opencv2/videoio.hpp>
#else
#define ARE_OPENCV 0
#endif
#include <algorithm>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

using namespace std;
#if ARE_OPENCV
using namespace cv;
#endif

struct Detectie {
    int idScan;
    string dataOra, obiect, categorie, model;
    double incredere;
    int x, y;

    Detectie() : idScan(0), incredere(0), x(0), y(0) {}
    Detectie(string data, string nume, string grupa, string numeModel, double scor, int coordX, int coordY)
        : idScan(0), dataOra(data), obiect(nume), categorie(grupa), model(numeModel), incredere(scor), x(coordX), y(coordY) {}
};

struct Afisare {
    // Afiseaza o detectie pe un singur rand.
    static void detectie(const Detectie& d) {
        cout << left << setw(5) << d.idScan << setw(18) << d.dataOra << setw(14) << d.obiect
             << setw(14) << d.categorie << setw(11) << fixed << setprecision(1) << d.incredere
             << "(" << d.x << ", " << d.y << ")  " << d.model << '\n';
    }

    // Afiseaza toate detectiile din jurnal.
    static void toate(const vector<Detectie>& detectii) {
        if (detectii.empty()) { cout << "Nu exista detectii.\n"; return; }
        cout << "\nID   Data si ora       Obiect        Categorie     Incredere Coordonate Model\n";
        cout << "--------------------------------------------------------------------------------\n";
        for (const Detectie& d : detectii) detectie(d);
    }
};

struct FiltruDetectii {
    vector<string> obiecte;
    vector<int> ultimulCadru;

    // Decide daca obiectul poate fi salvat din nou.
    bool esteNou(const string& obiect, int cadruCurent) {
        for (int i = 0; i < (int)obiecte.size(); i++) {
            if (obiecte[i] == obiect) {
                if (cadruCurent - ultimulCadru[i] < 120) return false;
                ultimulCadru[i] = cadruCurent;
                return true;
            }
        }
        obiecte.push_back(obiect);
        ultimulCadru.push_back(cadruCurent);
        return true;
    }
};

struct ConfiguratieScan {
    int dimensiuneImagine;
    double pragIncredere, pragNMS;

    ConfiguratieScan(int dimensiune, double incredere, double nms)
        : dimensiuneImagine(dimensiune), pragIncredere(incredere), pragNMS(nms) {}
};

const string FISIER_DATE = "detectii.txt";
const string FISIER_MODEL = "models/yolo12n.onnx";
const string URL_YOLO = "https://huggingface.co/webnn/yolo12n/resolve/main/onnx/yolo12n.onnx";
const ConfiguratieScan CONFIG_SCAN(640, 0.50, 0.45);
const vector<string> CLASE_COCO = {"person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"};

struct ConfiguratieAplicatie {
    string modelActiv;
    vector<string> obiecteSelectate;
    int secundeTimer;
    int cameraActiva;

    ConfiguratieAplicatie() : modelActiv(FISIER_MODEL), secundeTimer(5), cameraActiva(0) {}

    // Verifica daca obiectul trebuie pastrat dupa inferenta.
    bool esteSelectat(const string& obiect) const {
        return obiecteSelectate.empty() || find(obiecteSelectate.begin(), obiecteSelectate.end(), obiect) != obiecteSelectate.end();
    }

    // Permite selectarea sau stergerea obiectelor COCO.
    void selecteazaObiecte() {
        int optiune;
        do {
            cout << "\n--- Object Selection ---\n0. Toate obiectele\n";
            for (size_t i = 0; i < CLASE_COCO.size(); ++i) cout << i + 1 << ". " << CLASE_COCO[i] << '\n';
            cout << "-1. Inapoi\nSelectati indexul: "; cin >> optiune;
            if (optiune > 0 && optiune <= (int)CLASE_COCO.size()) {
                string obiect = CLASE_COCO[optiune - 1]; auto pozitie = find(obiecteSelectate.begin(), obiecteSelectate.end(), obiect);
                if (pozitie == obiecteSelectate.end()) obiecteSelectate.push_back(obiect); else obiecteSelectate.erase(pozitie);
            } else if (optiune == 0) obiecteSelectate.clear();
        } while (optiune != -1);
    }

    // Cauta fisiere ONNX si alege modelul activ.
    void selecteazaModel() {
        vector<string> modele;
        for (const auto& fisier : filesystem::recursive_directory_iterator("models"))
            if (fisier.is_regular_file() && fisier.path().extension() == ".onnx") modele.push_back(fisier.path().string());
        if (modele.empty()) { cout << "Nu exista fisiere ONNX in models.\n"; return; }
        cout << "\n--- Model Selection ---\n";
        for (size_t i = 0; i < modele.size(); ++i) cout << i + 1 << ". " << modele[i] << '\n';
        int optiune; cout << "Model activ: "; cin >> optiune;
        if (optiune > 0 && optiune <= (int)modele.size()) { modelActiv = modele[optiune - 1]; cout << "Model activ: " << modelActiv << '\n'; }
        else cout << "Optiune invalida.\n";
    }

#if ARE_OPENCV
    // Cauta camerele disponibile si alege una.
    void selecteazaCamera() {
        vector<int> camere;
        cout << "\n--- Camera Selection ---\n";

        for (int index = 0; index <= 4; index++) {
            VideoCapture camera(index);
            if (camera.isOpened()) {
                cout << index << ". Camera disponibila\n";
                camere.push_back(index);
                camera.release();
            }
        }

        if (camere.empty()) {
            cout << "Nu a fost gasita nicio camera.\n";
            return;
        }

        cout << "Index camera: ";
        int alegere;
        cin >> alegere;

        for (int camera : camere) {
            if (camera == alegere) {
                cameraActiva = alegere;
                cout << "Camera activa este " << cameraActiva << ".\n";
                return;
            }
        }
        cout << "Index indisponibil.\n";
    }
#else
    // Explica de ce selectorul nu este disponibil.
    void selecteazaCamera() {
        cout << "Selectorul necesita OpenCV.\n";
    }
#endif
};

struct JurnalDetectii {
    vector<Detectie> date;

    // Citeste detectiile deja salvate in fisier.
    void incarca() {
        ifstream fin(FISIER_DATE);
        string textId;
        string textIncredere;
        string textX;
        string textY;

        while (getline(fin, textId, '|')) {
            Detectie d;
            d.idScan = stoi(textId);
            getline(fin, d.dataOra, '|');
            getline(fin, d.obiect, '|');
            getline(fin, d.categorie, '|');
            getline(fin, textIncredere, '|');
            d.incredere = stod(textIncredere);
            getline(fin, textX, '|');
            d.x = stoi(textX);
            getline(fin, textY, '|');
            d.y = stoi(textY);
            getline(fin, d.model);
            date.push_back(d);
        }
    }

    // Returneaza urmatorul identificator disponibil.
    int urmatorulId() const {
        int maxim = 0;
        for (const Detectie& d : date) {
            if (d.idScan > maxim) maxim = d.idScan;
        }
        return maxim + 1;
    }

    // Creeaza data curenta pentru detectia noua.
    static string dataCurenta() { time_t acum = time(nullptr); tm local{}; localtime_s(&local, &acum); char rezultat[20]; strftime(rezultat, sizeof(rezultat), "%Y-%m-%d %H:%M", &local); return rezultat; }

    // Alege categoria practica pentru obiectul detectat.
    static string categoriePentru(const string& obiect) {
        if (obiect == "bottle" || obiect == "cup" || obiect == "wine glass") return "reciclabil";
        if (obiect == "banana" || obiect == "apple" || obiect == "orange" || obiect == "broccoli" || obiect == "carrot") return "organic";
        if (obiect == "cell phone" || obiect == "laptop" || obiect == "mouse" || obiect == "keyboard" || obiect == "tv") return "electronice";
        return "altele";
    }

    // Salveaza o detectie in memorie si fisier.
    void salveaza(Detectie d) {
        d.idScan = urmatorulId();
        ofstream fout(FISIER_DATE, ios::app);
        fout << d.idScan << '|';
        fout << d.dataOra << '|';
        fout << d.obiect << '|';
        fout << d.categorie << '|';
        fout << d.incredere << '|';
        fout << d.x << '|';
        fout << d.y << '|';
        fout << d.model << '\n';
        date.push_back(d);
    }

    // Adauga manual o detectie pentru testare.
    void adaugaManual() {
        Detectie d(dataCurenta(), "", "", "manual", 0, 0, 0);
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Obiect: ";
        getline(cin, d.obiect);
        cout << "Categorie: ";
        getline(cin, d.categorie);
        cout << "Incredere: ";
        cin >> d.incredere;
        cout << "Coordonata X: ";
        cin >> d.x;
        cout << "Coordonata Y: ";
        cin >> d.y;
        salveaza(d);
        cout << "Detectia a fost salvata.\n";
    }

    // Grupeaza si afiseaza detectiile dupa categorie.
    void grupeaza() const {
        for (int pozitie = 0; pozitie < (int)date.size(); pozitie++) {
            bool categoriaAfisata = false;

            for (int i = 0; i < pozitie; i++) {
                if (date[i].categorie == date[pozitie].categorie) {
                    categoriaAfisata = true;
                }
            }

            if (!categoriaAfisata) {
                cout << "\nCategoria: " << date[pozitie].categorie << '\n';
                for (const Detectie& d : date) {
                    if (d.categorie == date[pozitie].categorie) {
                        Afisare::detectie(d);
                    }
                }
            }
        }
    }

    // Afiseaza numarul detectiilor si increderea medie.
    void statistici() const {
        if (date.empty()) {
            cout << "Nu exista date.\n";
            return;
        }
        double suma = 0;
        for (const Detectie& d : date) {
            suma = suma + d.incredere;
        }
        cout << "Detectii salvate: " << date.size() << "\nIncredere medie: " << fixed << setprecision(1) << suma / date.size() << "%\n";
    }
};


// Verifica fisierele si OpenCV.
void verificaDependinte() {
    cout << "\n--- Verificare dependinte ---\n";
#if ARE_OPENCV
    cout << "[OK] OpenCV este inclus la compilarea programului.\n";
#else
    cout << "[LIPSA] OpenCV. Scanarea necesita recompilare cu OpenCV.\n";
#endif
    ifstream yolo(FISIER_MODEL);
    cout << (yolo ? "[OK] " : "[LIPSA] ") << FISIER_MODEL << '\n';
}

// Instaleaza OpenCV si modelul YOLO.
void instaleazaDependinte() {
    cout << "\nInstalare dependinte pentru acest PC...\n";
    int rezultat = system("if not exist C:\\msys64\\usr\\bin\\bash.exe winget install -e --id MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements");
    if (rezultat != 0 || !filesystem::exists("C:\\msys64\\usr\\bin\\bash.exe")) {
        cout << "MSYS2 nu este gata. Redeschideti aplicatia si alegeti iar Install Libraries.\n";
        return;
    }
    rezultat = system("C:\\msys64\\usr\\bin\\bash.exe -lc \"pacman -S --needed --noconfirm mingw-w64-ucrt-x86_64-gcc mingw-w64-ucrt-x86_64-opencv mingw-w64-ucrt-x86_64-qt6-base pkgconf\"");
    if (rezultat != 0) { cout << "Instalarea bibliotecilor a esuat.\n"; return; }
    filesystem::create_directories("models");
    if (!filesystem::exists(FISIER_MODEL)) {
        rezultat = system("curl.exe -fL https://huggingface.co/webnn/yolo12n/resolve/main/onnx/yolo12n.onnx -o models\\yolo12n.onnx");
        if (rezultat != 0) { cout << "Descarcarea YOLO a esuat.\n"; return; }
    }
    cout << "Se recompila si se porneste versiunea completa...\n";
    rezultat = system("set PATH=C:\\msys64\\ucrt64\\bin;%PATH% && set QT_QPA_PLATFORM_PLUGIN_PATH=C:\\msys64\\ucrt64\\share\\qt6\\plugins\\platforms && g++ -std=c++17 main.cpp -o jurnal_detectii.exe -IC:\\msys64\\ucrt64\\include\\opencv5 -LC:\\msys64\\ucrt64\\lib -lopencv_dnn -lopencv_highgui -lopencv_videoio -lopencv_imgcodecs -lopencv_imgproc -lopencv_core && jurnal_detectii.exe");
    if (rezultat != 0) cout << "Recompilarea sau pornirea a esuat.\n";
}

// Afiseaza meniul Startup si returneaza alegerea.
bool meniuPornire() {
    int optiune;
    do {
        cout << "\n--- Startup ---\n1. Check Libraries\n2. Install Libraries\n3. Continue\n0. Exit\nOptiune: ";
        if (!(cin >> optiune)) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); continue; }
        switch (optiune) {
            case 1: verificaDependinte(); break;
            case 2: instaleazaDependinte(); break;
            case 3: return true;
            case 0: return false;
            default: cout << "Optiune invalida.\n";
        }
    } while (true);
}

#if ARE_OPENCV
// Ruleaza YOLO live si salveaza numai obiectele noi.
void scaneazaCamera(JurnalDetectii& jurnal, const ConfiguratieAplicatie& configuratie) {
    ifstream test(configuratie.modelActiv);
    if (!test) {
        cout << "Lipseste " << configuratie.modelActiv << "\n";
        return;
    }

    dnn::Net net = dnn::readNetFromONNX(configuratie.modelActiv);
    VideoCapture camera(configuratie.cameraActiva);
    if (!camera.isOpened()) {
        cout << "Camera nu poate fi deschisa.\n";
        return;
    }

    cout << "Camera pornita. Scanarea live incepe dupa " << configuratie.secundeTimer << " secunde. ESC opreste.\n";
    Mat cadru;
    int inceput = getTickCount();

    // Afiseaza camera pentru cele cinci secunde initiale.
    while (true) {
        camera >> cadru;
        if (cadru.empty()) return;
        int ramase = configuratie.secundeTimer - (int)((getTickCount() - inceput) / getTickFrequency());
        putText(cadru, "Scanare in: " + to_string(max(0, ramase)), Point(20, 40), FONT_HERSHEY_SIMPLEX, 1, Scalar(0, 255, 255), 2);
        imshow("Camera live", cadru);
        int tasta = waitKey(20);
        if (tasta == 27) {
            destroyAllWindows();
            return;
        }
        if (ramase <= 0) break;
    }

    FiltruDetectii filtru;
    int numarCadru = 0;

    while (true) {
        camera >> cadru;
        if (cadru.empty()) break;
        numarCadru++;

        Mat patrat(CONFIG_SCAN.dimensiuneImagine, CONFIG_SCAN.dimensiuneImagine, CV_8UC3, Scalar(114, 114, 114));
        float scala = min((float)CONFIG_SCAN.dimensiuneImagine / cadru.cols, (float)CONFIG_SCAN.dimensiuneImagine / cadru.rows);
        Size dimensiune((int)(cadru.cols * scala), (int)(cadru.rows * scala));
        resize(cadru, patrat(Rect(0, 0, dimensiune.width, dimensiune.height)), dimensiune);

        Mat blob = dnn::blobFromImage(patrat, 1.0 / 255.0, Size(CONFIG_SCAN.dimensiuneImagine, CONFIG_SCAN.dimensiuneImagine), Scalar(), true, false);
        net.setInput(blob);
        vector<Mat> iesiri;
        net.forward(iesiri, net.getUnconnectedOutLayersNames());

        Mat date = iesiri[0];
        int dimensiuni[] = {date.size[1], date.size[2]};
        Mat rezultate(2, dimensiuni, CV_32F, date.ptr<float>());
        transpose(rezultate, rezultate);

        vector<Rect> cutii;
        vector<float> scoruri;
        vector<int> clase;

        for (int i = 0; i < rezultate.rows; i++) {
            Mat scoruriClase = rezultate.row(i).colRange(4, 84);
            Point clasa;
            double scor;
            minMaxLoc(scoruriClase, nullptr, &scor, nullptr, &clasa);
            if (scor < CONFIG_SCAN.pragIncredere) continue;

            float* valori = rezultate.ptr<float>(i);
            int x = (int)((valori[0] - valori[2] / 2) / scala);
            int y = (int)((valori[1] - valori[3] / 2) / scala);
            int latime = (int)(valori[2] / scala);
            int inaltime = (int)(valori[3] / scala);
            cutii.push_back(Rect(x, y, latime, inaltime));
            scoruri.push_back((float)scor);
            clase.push_back(clasa.x);
        }

        vector<int> detectiiBune;
        dnn::NMSBoxes(cutii, scoruri, CONFIG_SCAN.pragIncredere, CONFIG_SCAN.pragNMS, detectiiBune);
        int detectiiSalvate = 0;

        for (int i : detectiiBune) {
            string obiect = CLASE_COCO[clase[i]];
            if (!configuratie.esteSelectat(obiect)) continue;

            Rect imagine(0, 0, cadru.cols, cadru.rows);
            Rect cutie = cutii[i] & imagine;
            if (cutie.width <= 0 || cutie.height <= 0) continue;

            Detectie d(JurnalDetectii::dataCurenta(), obiect, JurnalDetectii::categoriePentru(obiect), "YOLO12n", scoruri[i] * 100, cutie.x, cutie.y);
            rectangle(cadru, cutie, Scalar(0, 255, 0), 2);
            putText(cadru, obiect, Point(d.x, max(20, d.y - 5)), FONT_HERSHEY_SIMPLEX, .7, Scalar(0, 255, 0), 2);

            if (filtru.esteNou(obiect, numarCadru)) {
                jurnal.salveaza(d);
                detectiiSalvate++;
            }
        }

        string mesajLive = "LIVE: " + to_string(detectiiBune.size()) + " detectii - ESC pentru oprire";
        putText(cadru, mesajLive, Point(20, 40), FONT_HERSHEY_SIMPLEX, .8, Scalar(0, 255, 255), 2);
        imshow("Camera live", cadru);

        if (detectiiSalvate > 0) cout << "Detectii noi salvate: " << detectiiSalvate << '\n';

        if (waitKey(1) == 27) break;
    }
    destroyAllWindows();
}
#else
// Explica absenta OpenCV pentru versiunea de baza.
void scaneazaCamera(JurnalDetectii&, const ConfiguratieAplicatie&) {
    cout << "Scanarea necesita OpenCV. Recompilati cu comanda din README.\n";
}
#endif

struct Aplicatie {
    JurnalDetectii jurnal;
    ConfiguratieAplicatie configuratie;

    // Afiseaza optiunile principale.
    void afiseazaMeniu() const {
        cout << "\n--- Main Menu ---\n";
        cout << "1. Scanare camera live\n";
        cout << "2. Adaugare manuala\n";
        cout << "3. Afisare detectii\n";
        cout << "4. Grupare dupa categorie\n";
        cout << "5. Statistici\n";
        cout << "6. Object Selection\n";
        cout << "7. Model Selection\n";
        cout << "8. Camera Selection\n";
        cout << "0. Iesire\nOptiune: ";
    }

    // Executa optiunea aleasa de utilizator.
    void executa(int optiune) {
        switch (optiune) {
            case 1: scaneazaCamera(jurnal, configuratie); break;
            case 2: jurnal.adaugaManual(); break;
            case 3: Afisare::toate(jurnal.date); break;
            case 4: jurnal.grupeaza(); break;
            case 5: jurnal.statistici(); break;
            case 6: configuratie.selecteazaObiecte(); break;
            case 7: configuratie.selecteazaModel(); break;
            case 8: configuratie.selecteazaCamera(); break;
            case 0: break;
            default: cout << "Optiune invalida.\n";
        }
    }

    // Porneste aplicatia si meniurile ei.
    void ruleaza() {
        if (!meniuPornire()) return;
        jurnal.incarca();
        int optiune = -1;

        while (optiune != 0) {
            afiseazaMeniu();
            if (!(cin >> optiune)) {
                cin.clear();
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                continue;
            }
            executa(optiune);
        }
    }
};

int main() {
    Aplicatie aplicatie;
    aplicatie.ruleaza();
}