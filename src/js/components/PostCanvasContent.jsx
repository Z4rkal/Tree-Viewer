import React, { Component } from 'react';
import SearchBar from './SearchBar';

class PostCanvasContent extends Component {
    constructor() {
        super();

        this.state = {
            importStr: '',
            exportStr: '',
            exportDisplay: false,
            errStr: '',
            isErr: false
        };
    }

    setErr(errStr) {
        this.setState(() => {
            return {
                errStr: errStr,
                isErr: true
            }
        });
    }

    clearErr() {
        this.setState(() => {
            return {
                errStr: '',
                isErr: false
            }
        });
    }

    closePopout() {
        this.setState(() => {
            return {
                exportStr: '',
                exportDisplay: false
            }
        });
    }

    updateInput(field, value) {
        this.setState(() => {
            return { [field]: value }
        }, () => { if (this.state.isErr) this.clearErr(); });
    }

    getExportUrl() {
        this.setState(() => {
            const { handleEncode } = this.props;
            return {
                exportStr: handleEncode(),
                exportDisplay: true,
            }
        }, () => { if (this.state.isErr) this.clearErr(); });
    }

    handleImportUrl() {
        const { importStr } = this.state;
        const { handleDecode } = this.props;

        const base64Extractor = /[^\/\+]+$/;

        if (importStr.length === 0 || !base64Extractor.test(importStr)) {
            this.setErr(`Invalid import string >:(`);
            return;
        }

        const importBase64 = importStr.match(base64Extractor)[0];
        try {
            handleDecode(importBase64);
        }
        catch (error) {
            console.log(error);
            this.setErr(`Error decoding import string: ${error}`);
        }
    }

    render() {
        const { errStr, isErr, exportStr, exportDisplay } = this.state;
        const { loaded, nodes } = this.props;

        if (!loaded)
            return (
                <>
                    <div id='import-url-container' className='canvas-info-container'>
                    </div>
                    <div id='export-button-container' className='canvas-info-container'>
                    </div>
                </>
            )

        //Should dynamically size export popout based on the size of the string, rather than doing it in the stylesheet
        return (
            <>
                <div id='import-url-container' className='canvas-info-container'>
                    <input id='import-bar' className='url-bar' value={this.state.importStr} onChange={(e) => this.updateInput('importStr', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') this.handleImportUrl(); }}></input>
                    <button onClick={() => this.handleImportUrl()}>Import</button>
                    <p id='import-err' style={isErr ? {} : { display: 'none' }}>{errStr}</p>
                </div>
                <div id='export-button-container' className='canvas-info-container'>
                    <button onClick={() => this.getExportUrl()}>Export</button>
                </div>
                <div id='export-url-container' className='info-popout' style={exportDisplay ? {} : { display: 'none' }}>
                    <p id='export-bar' className='url-bar'>{exportStr}</p>
                    <button onClick={() => this.closePopout()}>Close</button>
                </div>
                <div id='search-bar-container' className='canvas-info-container'>
                    <SearchBar nodes={nodes} />
                </div>
            </>
        );
    }
}
export default PostCanvasContent;

//Exported Tree String, I'll leave it here for now for safekeeping while I'm breaking stuff
//AAAABAMDAAQHBLMI9AksEFERLRUnFm8aHRo4HNwdFB4IHtoi9CSaJKonLyj6KpgsnC0fMtE1kjbpOlg6xjrhOulBh0VHRZ1G_keFSp9Ms025TeNTUlXGVi5Z818qYvRjQWZUZp5ncWobakNr22wLbRlxsnHzcg9yxXl_fIOCx4PbhTKFYIhAibyLZYt2jLGOvo8aj0aQM5BVksGUb5UgmuCbipuhoOaiAKZXpqynCKflqqmqxK1IrvS3PriTvOq-Sb5Pv5fAZsHzxorJPcy80B_SKtOP2L3fsODd42rr5Ovu7IPsiuzo7-vwH_Ie8kX56PrS_gr-gf6P_rM=

//AAAABAMDAASzCPQJLBBREQ8VJxZvGh0aOBzcHRQeCB7aIvQkmiSqJy8o-iqYLR8y0TWSNuk6WDrGOuE66TsNOz9Bh0VHRZ1G_keFSp9Ms025TeNTUlSuVcZWLlnzXyphKGL0Y0FmVGaeZ3FqG2pDa9tsC20ZcbJx83IPcsV0VXl_fIN9GH3SgseD24UyhWCGyohAibyLZYt2jLGPGo9GkDOQVZRvlSCa4JuKm6Gg5qIAplemrKcIp-WqqarErJitSK70tz64k7zqvkm-T7-XwGbB88aKyT3MvNAf0irTj9i934rg3eNq6-7sg-zo7-vwH_Ie8kX31_no-tL-Cv6B_o_-sw==