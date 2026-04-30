; ============================================================
; sqla-installer.iss
; Wizard de instalación de SQLa para Windows
; Compilar con: ISCC.exe sqla-installer.iss
; ============================================================

#define AppName      "SQLa"
#define AppVersion   "1.0.0"
#define AppPublisher "Jonathan David Fonseca & José David Gómez"
#define AppURL       "https://github.com/TataoFonseca/SQLa"
#define ExeName      "sqla-server.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
OutputDir=output
OutputBaseFilename=SQLa-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
MinVersion=10.0
PrivilegesRequired=admin
UninstallDisplayIcon={app}\sqla-server.exe

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
; Ejecutable del backend (empaquetado con pkg, incluye Node.js runtime)
Source: "output\sqla-server.exe"; DestDir: "{app}"; Flags: ignoreversion

; Wrapper VBS — lanza el exe sin ventana de consola visible
Source: "sqla-launcher.vbs"; DestDir: "{app}"; Flags: ignoreversion

; Frontend build — express.static lo sirve desde {app}\dist\ en producción
Source: "output\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; Scripts de base de datos
Source: "output\db-scripts\01_sqla_setup.sql";       DestDir: "{app}\db-scripts"; Flags: ignoreversion
Source: "output\db-scripts\02_Chinook_SqlServer.sql"; DestDir: "{app}\db-scripts"; Flags: ignoreversion

[Icons]
; Los accesos directos apuntan al VBS para que no aparezca la ventana de consola.
; IconFilename apunta al exe para mostrar el ícono correcto en el acceso directo.
Name: "{group}\{#AppName}";              Filename: "wscript.exe"; Parameters: """{app}\sqla-launcher.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\{#ExeName}"
Name: "{group}\Desinstalar {#AppName}";  Filename: "{uninstallexe}"
Name: "{commondesktop}\{#AppName}";      Filename: "wscript.exe"; Parameters: """{app}\sqla-launcher.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\{#ExeName}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el escritorio"; GroupDescription: "Opciones adicionales:"

[Run]
Filename: "wscript.exe"; Parameters: """{app}\sqla-launcher.vbs"""; WorkingDir: "{app}"; Description: "Iniciar {#AppName}"; Flags: postinstall nowait skipifsilent

; ============================================================
; CÓDIGO PASCAL — Lógica personalizada del wizard
; ============================================================
[Code]

var
  SqlServerPage:     TInputQueryWizardPage;
  PrereqPage:        TWizardPage;
  SqlStatusLabel:    TLabel;
  SqlcmdStatusLabel: TLabel;

  DbServer:   String;
  DbPassword: String;
  DbPort:     String;

  SqlServerFound: Boolean;
  SqlcmdFound:    Boolean;

// ── Helpers ─────────────────────────────────────────────────

function SqlcmdExists(): Boolean;
var
  RC: Integer;
begin
  Result := Exec('sqlcmd', '-?', '', SW_HIDE, ewWaitUntilTerminated, RC);
end;

function SqlServerInRegistry(): Boolean;
var
  Keys: TArrayOfString;
  RegKey: String;
begin
  Result := False;
  RegKey := 'SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL';

  // Registro de 64 bits — SQL Server 2016 / 2019 / 2022 (version 130, 150, 160)
  if RegGetSubkeyNames(HKLM or $100, RegKey, Keys) then
    if GetArrayLength(Keys) > 0 then begin Result := True; Exit; end;

  // Registro de 32 bits — SQL Server 2014 y anteriores
  if RegGetSubkeyNames(HKLM, RegKey, Keys) then
    if GetArrayLength(Keys) > 0 then begin Result := True; Exit; end;

  // Fallback: verificar carpeta de instalacion en disco (cubre cualquier version)
  Result := DirExists(ExpandConstant('{commonpf64}\Microsoft SQL Server')) or
            DirExists(ExpandConstant('{commonpf32}\Microsoft SQL Server'));
end;

// ── Crear páginas personalizadas ────────────────────────────

procedure InitializeWizard();
var
  SqlLabel, SqlcmdLabel, NoteLabel: TLabel;
begin
  PrereqPage := CreateCustomPage(
    wpWelcome,
    'Verificación de requisitos',
    'SQLa verifica que el sistema cuente con los componentes necesarios.'
  );

  SqlLabel := TLabel.Create(PrereqPage);
  SqlLabel.Parent     := PrereqPage.Surface;
  SqlLabel.Left       := 0;
  SqlLabel.Top        := 20;
  SqlLabel.Width      := 200;
  SqlLabel.Caption    := 'Microsoft SQL Server:';
  SqlLabel.Font.Style := [fsBold];

  SqlStatusLabel := TLabel.Create(PrereqPage);
  SqlStatusLabel.Parent  := PrereqPage.Surface;
  SqlStatusLabel.Left    := 210;
  SqlStatusLabel.Top     := 20;
  SqlStatusLabel.Width   := 250;
  SqlStatusLabel.Caption := 'Comprobando...';

  SqlcmdLabel := TLabel.Create(PrereqPage);
  SqlcmdLabel.Parent     := PrereqPage.Surface;
  SqlcmdLabel.Left       := 0;
  SqlcmdLabel.Top        := 48;
  SqlcmdLabel.Width      := 200;
  SqlcmdLabel.Caption    := 'Herramienta sqlcmd:';
  SqlcmdLabel.Font.Style := [fsBold];

  SqlcmdStatusLabel := TLabel.Create(PrereqPage);
  SqlcmdStatusLabel.Parent  := PrereqPage.Surface;
  SqlcmdStatusLabel.Left    := 210;
  SqlcmdStatusLabel.Top     := 48;
  SqlcmdStatusLabel.Width   := 250;
  SqlcmdStatusLabel.Caption := 'Comprobando...';

  NoteLabel := TLabel.Create(PrereqPage);
  NoteLabel.Parent   := PrereqPage.Surface;
  NoteLabel.Left     := 0;
  NoteLabel.Top      := 90;
  NoteLabel.Width    := PrereqPage.SurfaceWidth;
  NoteLabel.WordWrap := True;
  NoteLabel.Caption  :=
    'Si SQL Server no está instalado, descárgalo gratis en:' + #13#10 +
    'https://www.microsoft.com/es-es/sql-server/sql-server-downloads' + #13#10 + #13#10 +
    'Selecciona la edición "Express" y durante la instalación activa:' + #13#10 +
    '  - Autenticación mixta (SQL Server + Windows)' + #13#10 +
    '  - Protocolo TCP/IP en el puerto 1433';

  SqlServerPage := CreateInputQueryPage(
    PrereqPage.ID,
    'Configuración de base de datos',
    'Ingresa los datos de conexión a tu instancia de SQL Server.',
    ''
  );

  SqlServerPage.Add('Servidor SQL (ej: localhost o EQUIPO\SQLEXPRESS):', False);
  SqlServerPage.Add('Contraseña para el usuario sandbox_user:', True);
  SqlServerPage.Add('Puerto SQL Server:', False);

  SqlServerPage.Values[0] := 'localhost';
  SqlServerPage.Values[1] := '';
  SqlServerPage.Values[2] := '1433';
end;

// ── Actualizar labels al entrar a la página de prereqs ──────

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = PrereqPage.ID then
  begin
    SqlServerFound := SqlServerInRegistry();
    SqlcmdFound    := SqlcmdExists();

    if SqlServerFound then
    begin
      SqlStatusLabel.Caption    := 'Encontrado';
      SqlStatusLabel.Font.Color := clGreen;
    end
    else
    begin
      SqlStatusLabel.Caption    := 'No encontrado';
      SqlStatusLabel.Font.Color := clRed;
    end;

    if SqlcmdFound then
    begin
      SqlcmdStatusLabel.Caption    := 'Disponible';
      SqlcmdStatusLabel.Font.Color := clGreen;
    end
    else
    begin
      SqlcmdStatusLabel.Caption    := 'No disponible';
      SqlcmdStatusLabel.Font.Color := clRed;
    end;
  end;
end;

// ── Validación antes de avanzar ─────────────────────────────

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if CurPageID = PrereqPage.ID then
  begin
    if not SqlServerFound then
    begin
      if MsgBox(
        'Microsoft SQL Server no fue detectado en este equipo.' + #13#10 +
        'La aplicación no funcionará sin él.' + #13#10 + #13#10 +
        '¿Deseas continuar de todas formas?',
        mbConfirmation, MB_YESNO
      ) = IDNO then
        Result := False;
    end;
  end;

  if CurPageID = SqlServerPage.ID then
  begin
    if Trim(SqlServerPage.Values[0]) = '' then
    begin
      MsgBox('El nombre del servidor es obligatorio.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    if Trim(SqlServerPage.Values[1]) = '' then
    begin
      MsgBox('La contraseña es obligatoria.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    if Trim(SqlServerPage.Values[2]) = '' then
      SqlServerPage.Values[2] := '1433';

    DbServer   := Trim(SqlServerPage.Values[0]);
    DbPassword := Trim(SqlServerPage.Values[1]);
    DbPort     := Trim(SqlServerPage.Values[2]);
  end;
end;

// ── Post-instalación: crear .env y ejecutar scripts SQL ─────

procedure CreateEnvFile(InstallDir: String);
var
  EnvPath: String;
  Lines:   TArrayOfString;
begin
  EnvPath := InstallDir + '\.env';
  SetArrayLength(Lines, 5);
  Lines[0] := 'DB_USER=sandbox_user';
  Lines[1] := 'DB_PASSWORD=' + DbPassword;
  Lines[2] := 'DB_SERVER=' + DbServer;
  Lines[3] := 'DB_DATABASE=sqla_sandbox';
  Lines[4] := 'DB_PORT=' + DbPort;
  SaveStringsToFile(EnvPath, Lines, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  InstallDir:          String;
  Script01, Script02:  String;
  ExitCode01, ExitCode02: Integer;
  LaunchOk: Boolean;
begin
  if CurStep = ssPostInstall then
  begin
    InstallDir := ExpandConstant('{app}');
    Script01   := InstallDir + '\db-scripts\01_sqla_setup.sql';
    Script02   := InstallDir + '\db-scripts\02_Chinook_SqlServer.sql';

    // 1. Crear .env con las credenciales ingresadas por el usuario
    CreateEnvFile(InstallDir);

    // 2. Ejecutar scripts SQL si las herramientas están disponibles
    if SqlcmdFound and SqlServerFound then
    begin
      WizardForm.StatusLabel.Caption := 'Configurando base de datos...';

      // Script 01: autenticación Windows (crea BD y usuario sandbox_user)
      LaunchOk := Exec(
        'sqlcmd',
        '-S ' + DbServer + ',' + DbPort + ' -E -i "' + Script01 + '"',
        '', SW_HIDE, ewWaitUntilTerminated, ExitCode01
      );

      // Script 02: autenticación SQL con sandbox_user (carga Chinook)
      ExitCode02 := 1;
      if LaunchOk and (ExitCode01 = 0) then
        Exec(
          'sqlcmd',
          '-S ' + DbServer + ',' + DbPort + ' -U sandbox_user -P "' + DbPassword + '" -i "' + Script02 + '"',
          '', SW_HIDE, ewWaitUntilTerminated, ExitCode02
        );

      if (not LaunchOk) or (ExitCode01 <> 0) or (ExitCode02 <> 0) then
        MsgBox(
          'Advertencia: No se pudieron ejecutar los scripts SQL automáticamente.' + #13#10 +
          'Puedes ejecutarlos manualmente desde:' + #13#10 +
          InstallDir + '\db-scripts\',
          mbInformation, MB_OK
        );
    end
    else
    begin
      MsgBox(
        'sqlcmd no está disponible. Los scripts no se ejecutaron.' + #13#10 +
        'Ejecútalos manualmente desde:' + #13#10 +
        InstallDir + '\db-scripts\' + #13#10 + #13#10 +
        '1. 01_sqla_setup.sql        (con autenticación Windows)' + #13#10 +
        '2. 02_Chinook_SqlServer.sql (con usuario sandbox_user)',
        mbInformation, MB_OK
      );
    end;
  end;
end;
