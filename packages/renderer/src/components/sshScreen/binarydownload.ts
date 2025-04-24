
export const CompressedPath = {
    Linux: ['mpboot'],
    Mac: ['mpboot'],
    Windows: ['mpboot.exe'],
};

export const BinaryUrls = {
    Linux: 'https://github.com/aqaurius6666/mpboot/releases/download/v0.0.1/mpboot-sse4-ubuntu-latest-v0.0.1.zip',
    Mac: 'https://github.com/aqaurius6666/mpboot/releases/download/v0.0.1/mpboot-sse4-macos-latest-v0.0.1.zip',
    Windows: 'https://github.com/aqaurius6666/mpboot/releases/download/v0.0.1/mpboot-sse4-windows-latest-v0.0.1.7z',
};

export function getBinaryPathRemote(os = 'linux') {
    const separator = os === 'windows' ? '\\' : '/';
    const binaryPath = os === 'windows' ? CompressedPath.Windows :
        os === 'linux' ? CompressedPath.Linux :
            CompressedPath.Mac;

    const homePrefix = os === 'windows' ? '%USERPROFILE%' : '~';
    
    return [homePrefix, '.config', 'mpboot', 'bin', binaryPath]
        .join(separator);
}