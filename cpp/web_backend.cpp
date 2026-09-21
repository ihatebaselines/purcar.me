// PURCAR ORZ local backend.  Compile with the same MinGW/OpenCV used by the
// original program.  It reuses the YOLO/OpenCV camera pipeline, but exposes
// its output over localhost so a browser can display it.
#define WIN32_LEAN_AND_MEAN
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <opencv2/dnn.hpp>
#include <opencv2/highgui.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/imgproc.hpp>
#include <opencv2/videoio.hpp>
#include <algorithm>
#include <atomic>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <fstream>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

using namespace cv;
using namespace std;

static const string MODEL = "models/yolo12n.onnx";
static const vector<string> COCO = {"person","bicycle","car","motorcycle","airplane","bus","train","truck","boat","traffic light","fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow","elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee","skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard","tennis racket","bottle","wine glass","cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange","broccoli","carrot","hot dog","pizza","donut","cake","chair","couch","potted plant","bed","dining table","toilet","tv","laptop","mouse","remote","keyboard","cell phone","microwave","oven","toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear","hair drier","toothbrush"};

struct ServerState {
    mutex lock;
    atomic<bool> running;
    atomic<bool> quit;
    double threshold;
    int cameraIndex;
    double fps;
    int detectionCount;
    double confidenceSum;
    string selectedObject;
    string commandMessage;
    vector<unsigned char> jpeg;
    vector<string> logs;
    ServerState() : running(false), quit(false), threshold(.50), cameraIndex(0), fps(0), detectionCount(0), confidenceSum(0), selectedObject("all") {}
} state;

static string now() { time_t t=time(0); tm local; localtime_s(&local,&t); char b[12]; strftime(b,sizeof(b),"%H:%M:%S",&local); return b; }
static void addLog(const string& text) { lock_guard<mutex> guard(state.lock); state.logs.push_back("["+now()+"] [INFO] "+text); if(state.logs.size()>80) state.logs.erase(state.logs.begin()); }
static string jsonEscape(const string& v) { string r; for(size_t i=0;i<v.size();++i) { char c=v[i]; if(c=='\\' || c=='\"') r+='\\'; if(c=='\n') r+="\\n"; else r+=c; } return r; }

// Same ONNX pre-processing, class scoring and NMS approach as the supplied source.
static void annotate(dnn::Net& net, Mat& frame, double threshold) {
    const int size=640;
    Mat square(size,size,CV_8UC3,Scalar(114,114,114));
    float scale=min((float)size/frame.cols,(float)size/frame.rows);
    Size scaled((int)(frame.cols*scale),(int)(frame.rows*scale));
    resize(frame,square(Rect(0,0,scaled.width,scaled.height)),scaled);
    Mat blob=dnn::blobFromImage(square,1.0/255.0,Size(size,size),Scalar(),true,false);
    net.setInput(blob); vector<Mat> outputs; net.forward(outputs,net.getUnconnectedOutLayersNames());
    if(outputs.empty() || outputs[0].dims<3) return;
    Mat raw=outputs[0]; int d[]={raw.size[1],raw.size[2]}; Mat rows(2,d,CV_32F,raw.ptr<float>()); transpose(rows,rows);
    vector<Rect> boxes; vector<float> scores; vector<int> ids;
    for(int i=0;i<rows.rows;i++) {
        Mat classScores=rows.row(i).colRange(4,min(84,rows.cols)); Point id; double score=0;
        minMaxLoc(classScores,0,&score,0,&id); if(score<threshold || id.x>=(int)COCO.size()) continue;
        float* v=rows.ptr<float>(i); int w=(int)(v[2]/scale),h=(int)(v[3]/scale);
        boxes.push_back(Rect((int)((v[0]-v[2]/2)/scale),(int)((v[1]-v[3]/2)/scale),w,h)); scores.push_back((float)score); ids.push_back(id.x);
    }
    vector<int> keep; dnn::NMSBoxes(boxes,scores,(float)threshold,.45f,keep);
    for(size_t j=0;j<keep.size();j++) { int i=keep[j]; Rect box=boxes[i]&Rect(0,0,frame.cols,frame.rows); if(box.width<=0||box.height<=0) continue;
        { lock_guard<mutex> guard(state.lock); if(state.selectedObject!="all" && state.selectedObject!=COCO[ids[i]]) continue; state.detectionCount++; state.confidenceSum+=scores[i]*100.0; }
        Scalar color(j%3==0?Scalar(105,234,72):j%3==1?Scalar(255,120,54):Scalar(83,83,251)); rectangle(frame,box,color,3);
        string label=COCO[ids[i]]+" "+to_string((int)(scores[i]*100))+"%"; int base=0; Size ts=getTextSize(label,FONT_HERSHEY_SIMPLEX,.6,1,&base);
        rectangle(frame,Rect(box.x,max(0,box.y-ts.height-10),ts.width+10,ts.height+10),color,FILLED); putText(frame,label,Point(box.x+5,max(ts.height,box.y-5)),FONT_HERSHEY_SIMPLEX,.6,Scalar(255,255,255),1);
    }
}

static void cameraLoop() {
    dnn::Net net; bool modelLoaded=false; VideoCapture camera;
    while(!state.quit) {
        if(!state.running) { if(camera.isOpened()) camera.release(); this_thread::sleep_for(chrono::milliseconds(80)); continue; }
        if(!modelLoaded) { try { net=dnn::readNetFromONNX(MODEL); modelLoaded=true; addLog("Model incarcat cu succes."); } catch(const Exception& e) { addLog(string("EROARE model: ")+e.what()); state.running=false; continue; } }
        if(!camera.isOpened()) { camera.open(state.cameraIndex); if(!camera.isOpened()) { addLog("EROARE: Camera nu poate fi deschisa."); state.running=false; continue; } addLog("Camera pornita. Detectia ruleaza..."); }
        Mat frame; camera>>frame; if(frame.empty()) continue; auto started=chrono::high_resolution_clock::now(); double threshold; {lock_guard<mutex> guard(state.lock); threshold=state.threshold;}
        try { annotate(net,frame,threshold); } catch(const Exception& e) { addLog(string("EROARE inferenta: ")+e.what()); state.running=false; continue; }
        vector<unsigned char> out; imencode(".jpg",frame,out,vector<int>(1,IMWRITE_JPEG_QUALITY)); auto ended=chrono::high_resolution_clock::now();
        { lock_guard<mutex> guard(state.lock); state.jpeg.swap(out); state.fps=1000.0/chrono::duration_cast<chrono::milliseconds>(ended-started).count(); }
    }
    camera.release();
}

static bool sendAll(SOCKET s,const string& text) { const char* p=text.c_str(); int left=(int)text.size(); while(left){int n=send(s,p,left,0);if(n<=0)return false;p+=n;left-=n;}return true; }
static bool sendBytes(SOCKET s,const vector<unsigned char>& bytes) { size_t done=0; while(done<bytes.size()){int n=send(s,(const char*)&bytes[done],(int)min((size_t)65536,bytes.size()-done),0);if(n<=0)return false;done+=n;}return true; }
static string response(const string& body,const string& type="application/json") { ostringstream o;o<<"HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nContent-Type: "<<type<<"\r\nContent-Length: "<<body.size()<<"\r\nConnection: close\r\n\r\n"<<body;return o.str(); }
static string statusJson() { lock_guard<mutex> g(state.lock); ostringstream o;o<<"{\"running\":"<<(state.running?"true":"false")<<",\"fps\":"<<fixed<<setprecision(1)<<state.fps<<",\"camera\":"<<state.cameraIndex<<",\"message\":\""<<jsonEscape(state.commandMessage)<<"\",\"logs\":[";for(size_t i=0;i<state.logs.size();i++){if(i)o<<',';o<<'\"'<<jsonEscape(state.logs[i])<<'\"';}o<<"]}";return o.str(); }
static int parseInt(const string& request,const string& key,int fallback) { size_t p=request.find(key);if(p==string::npos)return fallback;p+=key.size();return atoi(request.c_str()+p); }
static double parseDouble(const string& request,const string& key,double fallback) { size_t p=request.find(key);if(p==string::npos)return fallback;p+=key.size();return atof(request.c_str()+p); }
static string parseText(const string& request,const string& key) { size_t p=request.find(key);if(p==string::npos)return "";p+=key.size();size_t end=request.find_first_of("& \\r\\n",p);string v=request.substr(p,end==string::npos?string::npos:end-p);for(size_t i=0;i<v.size();i++){if(v[i]=='+')v[i]=' ';}return v; }
static void command(int cmd,const string& value) {
    lock_guard<mutex> g(state.lock);
    if(cmd==1){state.running=true;state.commandMessage="[INFO] Se porneste camera (index "+to_string(state.cameraIndex)+")...";}
    else if(cmd==2){int index=value.empty()?state.cameraIndex:atoi(value.c_str());state.cameraIndex=max(0,min(4,index));state.commandMessage="Camera selectata: index "+to_string(state.cameraIndex)+".";}
    else if(cmd==3){state.selectedObject=value.empty()?"all":value;state.commandMessage="Obiect urmarit: "+state.selectedObject+".";}
    else if(cmd==4){double t=value.empty()?state.threshold:atof(value.c_str());state.threshold=max(.05,min(.95,t));ostringstream s;s<<"Prag incredere: "<<(int)(state.threshold*100)<<"%.";state.commandMessage=s.str();}
    else if(cmd==5){ostringstream s;s<<"Detectii salvate: "<<state.detectionCount<<" | Incredere medie: "<<(state.detectionCount?state.confidenceSum/state.detectionCount:0)<<"%";state.commandMessage=s.str();}
    else if(cmd==6){ofstream out("detectii_web.txt",ios::app);out<<now()<<"|detectii="<<state.detectionCount<<"|incredere_medie="<<(state.detectionCount?state.confidenceSum/state.detectionCount:0)<<"\n";state.commandMessage="Jurnal salvat in detectii_web.txt.";}
    else if(cmd==7||cmd==0){state.running=false;state.commandMessage=cmd==0?"Aplicatia s-a inchis. Backendul ramane disponibil.":"Detectia a fost oprita.";}
    else state.commandMessage="Optiune invalida.";
}
static void client(SOCKET s) {
    char buffer[4096]; int n=recv(s,buffer,sizeof(buffer)-1,0); if(n<=0){closesocket(s);return;} buffer[n]=0; string req(buffer);
    if(req.find("GET /stream")!=string::npos) { sendAll(s,"HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-cache\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n"); while(state.running&&!state.quit){vector<unsigned char> image;{lock_guard<mutex> g(state.lock);image=state.jpeg;}if(!image.empty()){ostringstream h;h<<"--frame\r\nContent-Type: image/jpeg\r\nContent-Length: "<<image.size()<<"\r\n\r\n";if(!sendAll(s,h.str())||!sendBytes(s,image)||!sendAll(s,"\r\n"))break;}this_thread::sleep_for(chrono::milliseconds(45));} }
    else if(req.find("POST /api/start")!=string::npos) { state.cameraIndex=parseInt(req,"camera=",0); double v=parseDouble(req,"threshold=",.5); {lock_guard<mutex> g(state.lock);state.threshold=max(.05,min(.95,v));} state.running=true;addLog("Se porneste camera (index "+to_string(state.cameraIndex)+")...");sendAll(s,response(statusJson())); }
    else if(req.find("POST /api/stop")!=string::npos) { state.running=false;addLog("Detectia a fost oprita.");sendAll(s,response(statusJson())); }
    else if(req.find("POST /api/command")!=string::npos) { int cmd=parseInt(req,"cmd=",-1); string value=parseText(req,"value="); command(cmd,value); addLog(state.commandMessage); sendAll(s,response(statusJson())); }
    else if(req.find("GET /api/status")!=string::npos) sendAll(s,response(statusJson()));
    else sendAll(s,response("{\"error\":\"not found\"}")); closesocket(s);
}
int main() {
    WSADATA w; if(WSAStartup(MAKEWORD(2,2),&w)) return 1; addLog("Backend C++ OpenCV pregatit pe http://127.0.0.1:8080"); thread(cameraLoop).detach();
    SOCKET server=socket(AF_INET,SOCK_STREAM,IPPROTO_TCP); sockaddr_in addr; ZeroMemory(&addr,sizeof(addr));addr.sin_family=AF_INET;addr.sin_addr.s_addr=htonl(INADDR_LOOPBACK);addr.sin_port=htons(8080); if(bind(server,(sockaddr*)&addr,sizeof(addr))==SOCKET_ERROR||listen(server,8)==SOCKET_ERROR){cerr<<"Nu pot porni portul 8080\n";return 1;} cout<<"PURCAR ORZ backend C++: http://127.0.0.1:8080\n";
    while(!state.quit){SOCKET c=accept(server,0,0);if(c!=INVALID_SOCKET)thread(client,c).detach();} closesocket(server);WSACleanup();return 0;
}
