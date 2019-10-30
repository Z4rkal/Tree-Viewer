import React, { Component } from 'react';

class SearchBar extends Component {
    constructor() {
        super();

        this.state = {
            search: ''
        }

        //We'll use a 250ms timeout so that we aren't running the search function every single time the input changes.
        //This should be short enough (around human reaction time) to not be very noticeable, 
        //but long enough to improve performance somewhat
        this.searchTimeout = null;

        this.updateSearch = this.updateSearch.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    updateSearch(value) {
        this.setState(() => {
            if (this.searchTimeout !== null) clearTimeout(this.searchTimeout);
            //The searchTimeout will run the handleSearch function 250ms after the user stops typing in the search field
            this.searchTimeout = setTimeout(() => this.handleSearch(), 250);
            return { search: value }
        })
    }

    handleSearch() {
        const { search } = this.state;
        const { nodes } = this.props;
        const { externalUpdater } = this.props;

        let matchingNodes = [];

        if (search !== '') {
            const searchPat = new RegExp(search.replace(/[\d#]+/g, '\\d+'), 'i');

            Object.values(nodes).map((node) => {
                const nodeId = node.id;
                const desc = node.fullString;

                if (searchPat.test(desc)) matchingNodes.push(nodeId);
            });
        }

        if (externalUpdater !== undefined && typeof externalUpdater === 'function') {
            externalUpdater(matchingNodes);
        }
        else {
            console.log(matchingNodes);
        }
    }

    render() {
        const { search } = this.state;

        return (
            <>
                <label htmlFor='#search-bar'>
                    Search:
                </label>
                <input id='search-bar' value={search} onChange={(e) => this.updateSearch(e.target.value)}></input>
            </>
        )
    }
}

export default SearchBar;