import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store/root';
import { useElectron } from './useElectron';
import { BinaryUrls, CompressedPath, getBinaryPathRemote } from '../components/sshScreen/binarydownload';

export const useBinarySetup = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const electron = useElectron();
  const remoteOS = useSelector((state: RootState) => state.ssh.remoteOS);

  useEffect(() => {
    const setupBinary = async () => {
      if (!remoteOS || isInstalling) return;
      
      setIsInstalling(true);
      setError(null);

      try {
        const tempDir = await electron.executeSSHCommand('mktemp -d');
        if (!tempDir.success) throw new Error('Failed to create temp directory');
        const tempPath = tempDir.output?.trim();

        const downloadUrl = remoteOS.includes('windows') ? BinaryUrls.Windows :
                          remoteOS.includes('darwin') ? BinaryUrls.Mac :
                          BinaryUrls.Linux;
        const archiveName = downloadUrl.split('/').pop();

        const downloadCmd = remoteOS.includes('windows') 
          ? `powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${tempPath}/${archiveName}'"` 
          : `cd ${tempPath} && curl -L "${downloadUrl}" -o "${archiveName}"`;

        const downloadResult = await electron.executeSSHCommand(downloadCmd);
        if (!downloadResult.success) throw new Error('Failed to download binary');

        const binaryPath = getBinaryPathRemote(remoteOS);
        const commands = [
          `mkdir -p $(dirname ${binaryPath})`,
          remoteOS.includes('windows')
            ? `cd ${tempPath} && 7z x ${archiveName} -o"extracted"` 
            : `cd ${tempPath} && unzip ${archiveName} -d "extracted"`,
          `cp ${tempPath}/extracted/${CompressedPath[remoteOS.includes('windows') ? 'Windows' : remoteOS.includes('darwin') ? 'Mac' : 'Linux']} ${binaryPath}`,
          remoteOS.includes('windows') ? 'echo "Windows - no chmod needed"' : `chmod +x ${binaryPath}`,
          `rm -rf ${tempPath}`,
        ];

        console.log('Commands to execute:', commands);

        for (const cmd of commands) {
          const result = await electron.executeSSHCommand(cmd);
          if (!result.success) throw new Error(`Command failed: ${cmd}`);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsInstalling(false);
      }
    };

    setupBinary();
  }, [remoteOS]);

  return { isInstalling, error };
};
