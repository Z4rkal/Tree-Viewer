import React, { Component } from 'react';

class SearchBar extends Component {
    constructor() {
        super();

        this.state = {
            search: ''
        }

        this.searchTimeout = null;

        this.updateSearch = this.updateSearch.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    updateSearch(value) {
        this.setState(() => {
            if (this.searchTimeout !== null) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.handleSearch(), 250);
            return { search: value }
        })
    }

    handleSearch() {
        const { search } = this.state;
        const { nodes } = this.props;

        const searchPat = new RegExp(search.replace(/\d+/g,'\d+'), 'i');

        let matchingNodes = {};

        Object.values(nodes).map((node) => {
            const nodeId = node.id;
            const desc = node.fullString;

            if (searchPat.test(desc)) matchingNodes[nodeId] = true;
        });

        console.log(matchingNodes);
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