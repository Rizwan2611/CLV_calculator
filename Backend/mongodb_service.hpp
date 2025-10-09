#pragma once
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <bsoncxx/json.hpp>
#include <bsoncxx/builder/stream/document.hpp>
#include <string>
#include <vector>
#include <iostream>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::open_document;
using bsoncxx::builder::stream::close_document;
using bsoncxx::builder::stream::finalize;

class MongoDBService {
private:
    static mongocxx::instance instance;
    mongocxx::client client;
    mongocxx::database db;
    std::string connection_string;

public:
    MongoDBService(const std::string& conn_str, const std::string& db_name)
        : client(mongocxx::uri(conn_str))
        , db(client[db_name]) 
        , connection_string(conn_str) {
        std::cout << "🔌 Connected to MongoDB: " << db_name << std::endl;
    }

    // Get collection
    mongocxx::collection getCollection(const std::string& collection_name) {
        return db[collection_name];
    }

    // Insert a document into the specified collection
    bool insertDocument(const std::string& collection_name, const bsoncxx::document::view_or_value& doc) {
        try {
            auto collection = db[collection_name];
            auto result = collection.insert_one(doc.view());
            return result ? true : false;
        } catch (const std::exception& e) {
            std::cerr << "❌ MongoDB Insert Error: " << e.what() << std::endl;
            return false;
        }
    }

    // Find documents in a collection
    std::vector<bsoncxx::document::value> findDocuments(
        const std::string& collection_name,
        const bsoncxx::document::view_or_value& filter = document{} << finalize) {
        
        std::vector<bsoncxx::document::value> results;
        try {
            auto collection = db[collection_name];
            auto cursor = collection.find(filter.view());
            
            for (auto&& doc : cursor) {
                results.push_back(bsoncxx::document::value(doc));
            }
        } catch (const std::exception& e) {
            std::cerr << "❌ MongoDB Find Error: " << e.what() << std::endl;
        }
        return results;
    }

    // Get count of documents in a collection
    int64_t countDocuments(const std::string& collection_name, 
                          const bsoncxx::document::view_or_value& filter = document{} << finalize) {
        try {
            auto collection = db[collection_name];
            return collection.count_documents(filter.view());
        } catch (const std::exception& e) {
            std::cerr << "❌ MongoDB Count Error: " << e.what() << std::endl;
            return -1;
        }
    }

    // Update a document
    bool updateDocument(const std::string& collection_name,
                       const bsoncxx::document::view_or_value& filter,
                       const bsoncxx::document::view_or_value& update,
                       bool upsert = false) {
        try {
            auto collection = db[collection_name];
            mongocxx::options::update options;
            options.upsert(upsert);
            
            auto result = collection.update_one(filter.view(), update.view(), options);
            return result ? (result->modified_count() > 0 || result->upserted_id()) : false;
        } catch (const std::exception& e) {
            std::cerr << "❌ MongoDB Update Error: " << e.what() << std::endl;
            return false;
        }
    }

    // Delete documents
    int64_t deleteDocuments(const std::string& collection_name,
                           const bsoncxx::document::view_or_value& filter) {
        try {
            auto collection = db[collection_name];
            auto result = collection.delete_many(filter.view());
            return result ? result->deleted_count() : 0;
        } catch (const std::exception& e) {
            std::cerr << "❌ MongoDB Delete Error: " << e.what() << std::endl;
            return -1;
        }
    }

    // Create an index
    bool createIndex(const std::string& collection_name,
                    const bsoncxx::document::view_or_value& keys,
                    bool unique = false) {
        try {
            auto collection = db[collection_name];
            mongocxx::options::index index_options{};
            index_options.unique(unique);
            
            collection.create_index(keys.view(), index_options);
            return true;
        } catch (const std::exception& e) {
            std::cerr << "⚠️  MongoDB Index Warning: " << e.what() << std::endl;
            return false;
        }
    }
};

// Initialize static instance
mongocxx::instance MongoDBService::instance{};
