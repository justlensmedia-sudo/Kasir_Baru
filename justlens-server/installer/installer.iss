; Inno Setup Script for Justlens Server
; Compiles standalone Justlens Server executable, auto SQLite DB, Windows Service & Firewall rule

#define MyAppName "Justlens Server"
#define MyAppVersion "1.3"
#define MyAppPublisher "Justlens System"
#define MyAppURL "http://localhost:5000"
#define MyAppExeName "justlens-server.exe"

[Setup]
AppId={{D1A3F5B8-9E2A-4B9C-8A11-3C6F7E8D90AB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=Justlens-Server-Setup-v{#MyAppVersion}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\dist\justlens-server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\node_sqlite3.node"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\build\Release\node_sqlite3.node"; DestDir: "{app}\build\Release"; Flags: ignoreversion
Source: "..\install-service.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\uninstall-service.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\scripts\setup-service.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\scripts\remove-service.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Justlens Admin UI (Browser)"; Filename: "http://localhost:5000"
Name: "{group}\Install Windows Service (Node)"; Filename: "node.exe"; Parameters: """{app}\install-service.js"""
Name: "{group}\Uninstall Windows Service (Node)"; Filename: "node.exe"; Parameters: """{app}\uninstall-service.js"""
Name: "{group}\Install Windows Service (PowerShell)"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\setup-service.ps1"""
Name: "{group}\Uninstall Windows Service (PowerShell)"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\remove-service.ps1"""
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

[Run]
; 1. Add Windows Firewall Inbound Rule for Port 5000 TCP (LAN Access)
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""Justlens Server (Port 5000)"" dir=in action=allow protocol=TCP localport=5000 profile=any"; StatusMsg: "Configuring Windows Firewall Port 5000..."; Flags: runhidden

; 2. Register & Start Windows Service automatically (JustlensServerService)
Filename: "sc.exe"; Parameters: "stop JustlensServerService"; Flags: runhidden; StatusMsg: "Stopping legacy service..."
Filename: "sc.exe"; Parameters: "delete JustlensServerService"; Flags: runhidden; StatusMsg: "Removing legacy service..."
Filename: "sc.exe"; Parameters: "create JustlensServerService binPath= """"{app}\{#MyAppExeName}"""" start= auto"; StatusMsg: "Registering Justlens POS Server Service..."; Flags: runhidden
Filename: "sc.exe"; Parameters: "description JustlensServerService ""Backend Service REST API & Database untuk Justlens System POS."""; StatusMsg: "Configuring Service Description..."; Flags: runhidden
Filename: "sc.exe"; Parameters: "failure JustlensServerService reset= 86400 actions= restart/5000/restart/5000/restart/5000"; StatusMsg: "Configuring Service Auto Recovery (Restart 5s)..."; Flags: runhidden
Filename: "sc.exe"; Parameters: "start JustlensServerService"; StatusMsg: "Starting Justlens POS Server Service..."; Flags: runhidden

[UninstallRun]
; 1. Stop & Remove Windows Service
Filename: "sc.exe"; Parameters: "stop JustlensServerService"; Flags: runhidden
Filename: "sc.exe"; Parameters: "delete JustlensServerService"; Flags: runhidden
Filename: "sc.exe"; Parameters: "stop JustlensServer"; Flags: runhidden
Filename: "sc.exe"; Parameters: "delete JustlensServer"; Flags: runhidden

; 2. Remove Windows Firewall Rule
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""Justlens Server (Port 5000)"""; Flags: runhidden

