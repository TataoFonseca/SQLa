Dim fso, shell, exePath, appDir
Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

appDir  = fso.GetParentFolderName(WScript.ScriptFullName)
exePath = fso.BuildPath(appDir, "sqla-server.exe")

' WorkingDir = carpeta de instalacion, para que dotenv encuentre el .env
shell.CurrentDirectory = appDir
shell.Run """" & exePath & """", 0, False
