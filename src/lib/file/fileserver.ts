import { ServerResponse } from 'http'
import * as Path from 'path'
import * as Fs from 'fs'
import * as Mime from 'mime-types'
import { EasyError } from '../error/error'

export const isSubPath = (mainPath: string, currentPath: string): boolean => {
    const combined = Path.join(mainPath, currentPath)
    return !!combined && combined.startsWith(Path.join(mainPath))
}

export const fileServer = (mainPath: string, options?: {listFiles: boolean, srcPath: string}): {mainPath: string, getFile:(path: string, res: ServerResponse) => void} => {
    return {
        mainPath: Path.resolve(mainPath),
        getFile: (path: string, res: ServerResponse): Promise<void> =>{
            return new Promise<void>((resolve, reject) => {
                const realMainPath = Path.resolve(mainPath)
                if (isSubPath(realMainPath, path))
                {
                    const fullPath = Path.join(realMainPath, path)
                    Fs.stat(fullPath, (err, stat)=>{
                        if (err)
                        {
                            reject(EasyError.BadRequest('Unable to open file', err.message))
                            return 
                        }
                        if (stat.isDirectory())
                        {
                            if (options?.listFiles)
                            {
                                Fs.readdir(fullPath, (err, files) => 
                                {
                                    if (err)
                                    {
                                        reject(EasyError.BadRequest('Unable to open folder', err.message))
                                        return
                                    }   
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const fileStr = files.reduce((prev, curr, _idx, _arr) => {
                                        return `<a href="${options?.srcPath}/${curr}"> ${curr}</a><br/>`
                                    }, '')
                                    res.writeHead(200, 
                                        {
                                            'Content-Type': 'text/html; charset=utf-8',
                                            'Content-Length': fileStr.length 
                                        }
                                    ).end(fileStr)
                                    resolve()
                                })
                                return 
                            }
                            else 
                            {
                                reject(EasyError.BadRequest('File not found'))  
                                return 
                            }
                        }
                        const mType = Mime.contentType(fullPath)

                        res.writeHead(200, {
                            'Content-Type': mType? mType: '',
                            'Content-Length': stat.size
                        })
                    
                        const readStream = Fs.createReadStream(fullPath)
                        const tmp = readStream.pipe(res)
                        tmp.on('finish', ()=>{resolve()})
                    })
                }
                else 
                {
                    reject(EasyError.BadRequest('Illegal path'))
                    return 
                }
            })
        }
    }

} 